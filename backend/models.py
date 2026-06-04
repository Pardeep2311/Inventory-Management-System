from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)  # Restricted to 50 chars to save space
    name = Column(String(100), nullable=False)                        # Restricted to 100 chars
    price = Column(Numeric(10, 2), nullable=False)                    # Numeric is highly optimized for storage
    stock_quantity = Column(Integer, nullable=False, default=0)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False) # Indexing speeds up unique validations
    phone = Column(String(20), nullable=True)                          # Minimal string allocations

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)