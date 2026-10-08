import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger("trading_terminal.database")

Base = declarative_base()

# Primary Async Engine (PostgreSQL or fallback)
engine = None
async_session_factory = None

async def init_database():
    global engine, async_session_factory
    
    # Try PostgreSQL first
    try:
        logger.info(f"Connecting to PostgreSQL database at {settings.DATABASE_URL}...")
        test_engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True
        )
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        engine = test_engine
        async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        logger.info("Successfully connected to PostgreSQL and synchronized schema.")
        return
    except Exception as pg_err:
        logger.warning(f"PostgreSQL connection failed ({pg_err}). Initializing async SQLite fallback...")
        
    try:
        engine = create_async_engine(
            settings.SQLITE_FALLBACK_URL,
            echo=False,
            connect_args={"check_same_thread": False}
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        logger.info("Initialized resilient local async database successfully.")
    except Exception as sql_err:
        logger.error(f"Database initialization failed: {sql_err}")
        raise sql_err

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if async_session_factory is None:
        await init_database()
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
