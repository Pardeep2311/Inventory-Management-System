from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemes
from database import get_db, engine

# Ensure tables are built
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory and Order Management System API")

# --- CORS SETTINGS ---
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For quick evaluation deployment ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PRODUCTS ENDPOINTS ---
@app.get("/products", response_model=list[schemes.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/products", response_model=schemes.ProductResponse)
def create_product(product: schemes.ProductCreate, db: Session = Depends(get_db)):
    # SKU uniqueness business rule validation
    existing = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="A product item with this variant SKU already exists.")
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- CUSTOMERS ENDPOINTS ---
@app.get("/customers", response_model=list[schemes.CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

@app.post("/customers", response_model=schemes.CustomerResponse)
def create_customer(customer: schemes.CustomerCreate, db: Session = Depends(get_db)):
    # Email uniqueness validation
    existing = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account registration aborted: Email already registered.")
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

# --- ORDERS MANAGEMENT WITH ATOMIC INVENTORY REDUCTION ---
@app.get("/orders", response_model=list[schemes.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()

@app.post("/orders", response_model=schemes.OrderResponse)
def place_order(order_req: schemes.OrderCreate, db: Session = Depends(get_db)):
    # Start atomic query validation
    product = db.query(models.Product).filter(models.Product.id == order_req.product_id).first()
    if not product:
        raise HTTPException(status_code=44, detail="Targeted inventory asset item not found.")
    
    customer = db.query(models.Customer).filter(models.Customer.id == order_req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer target context not found.")

    # Business Rule validation: Insufficient inventory guard
    if product.stock_quantity < order_req.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Order rejected: Insufficient database stock for '{product.name}'. Requested: {order_req.quantity}, Available: {product.stock_quantity}."
        )

    # Calculate price invoice
    calculated_total = product.price * order_req.quantity

    # Deduct structural balance stock directly
    product.stock_quantity -= order_req.quantity

    # Generate transaction record rows
    new_order = models.Order(
        customer_id=order_req.customer_id,
        product_id=order_req.product_id,
        quantity=order_req.quantity,
        total_price=calculated_total
    )

    db.add(new_order)
    db.commit() # Save both structural inventory deductions and order rows simultaneously
    db.refresh(new_order)
    return new_order