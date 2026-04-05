"""Check current user password hash and test login"""
import sys
sys.path.insert(0, '/Users/macbook/Documents/GitHub/Food-Roulette/backend')

from app.database.engine import SessionLocal
from app.models.models import User
from app.core.auth import verify_password

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == "edanur@mail.com").first()
    
    if user:
        print(f"✅ Kullanıcı bulundu: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Password Hash (ilk 50 char): {user.password_hash[:50]}...")
        print(f"\n   Hash tipi: {'argon2' if user.password_hash.startswith('$argon2') else 'bcrypt' if user.password_hash.startswith('$2') else 'unknown'}")
        
        # Test passwords
        test_passwords = ["dünyadamerhaba", "eda123eda", "password", "123456"]
        print(f"\n   Şifre testi:")
        for pwd in test_passwords:
            try:
                result = verify_password(pwd, user.password_hash)
                if result:
                    print(f"      ✅ '{pwd}' - DOĞRU")
                else:
                    print(f"      ❌ '{pwd}' - yanlış")
            except Exception as e:
                print(f"      ⚠️  '{pwd}' - Hata: {e}")
    else:
        print("❌ Kullanıcı bulunamadı")
        
except Exception as e:
    print(f"❌ Hata: {e}")
finally:
    db.close()
