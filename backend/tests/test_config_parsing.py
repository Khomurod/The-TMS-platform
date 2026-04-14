"""Config parsing tests for robust CORS_ORIGINS handling."""

from app.config import Settings


def test_cors_origins_accepts_json_array():
    s = Settings(cors_origins='["https://a.example.com","https://b.example.com"]')
    assert s.cors_origins == ["https://a.example.com", "https://b.example.com"]


def test_cors_origins_accepts_single_url():
    s = Settings(cors_origins="https://single.example.com")
    assert s.cors_origins == ["https://single.example.com"]


def test_cors_origins_accepts_comma_separated():
    s = Settings(cors_origins="https://a.example.com, https://b.example.com")
    assert s.cors_origins == ["https://a.example.com", "https://b.example.com"]


def test_cors_origins_accepts_bracket_without_quotes():
    s = Settings(cors_origins="[https://kinetic-frontend.example.com]")
    assert s.cors_origins == ["https://kinetic-frontend.example.com"]


def test_cors_origins_from_env_with_json_array(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", '["https://a.example.com"]')
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://x:y@localhost:5432/z")
    monkeypatch.setenv("JWT_SECRET_KEY", "test")
    monkeypatch.setenv("ENVIRONMENT", "development")
    s = Settings()
    assert s.cors_origins == ["https://a.example.com"]
