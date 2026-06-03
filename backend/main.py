from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import models, schemes, database
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Management System")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Products
@app.post("/products/", response_model=schemes.Product)
def create_product(product: schemes.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registered")
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/products/", response_model=List[schemes.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=schemes.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# Customers
@app.post("/customers/", response_model=schemes.Customer)
def create_customer(customer: schemes.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers/", response_model=List[schemes.Customer])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers

# Orders
@app.post("/orders/", response_model=schemes.Order)
def create_order(order: schemes.OrderCreate, db: Session = Depends(get_db)):
    # 1. Validate customer exists
    db_customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Validate stock for all items
    items_to_create = []
    for item in order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if db_product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {db_product.name}")
        
        items_to_create.append((db_product, item.quantity))

    # 3. Create Order
    db_order = models.Order(customer_id=order.customer_id)
    db.add(db_order)
    db.flush() # Get the order id

    # 4. Create OrderItems and Reduce Stock
    for db_product, quantity in items_to_create:
        db_product.stock_quantity -= quantity
        order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=db_product.id,
            quantity=quantity,
            price_at_order=db_product.price
        )
        db.add(order_item)

    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/orders/", response_model=List[schemes.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(models.Order).offset(skip).limit(limit).all()
    return orders

@app.get("/")
def read_root():
    return {"message": "Welcome to the Inventory Management System API"}
