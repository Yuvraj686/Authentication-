from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database_name: str = "auth_db"
    secret_key: str 
    algorithm: str
    access_token_expire_minutes: int

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
