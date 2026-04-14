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
