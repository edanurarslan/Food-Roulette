"""Script to seed initial recipe data into the database"""
import sys
sys.path.insert(0, '/Users/macbook/Documents/GitHub/Food-Roulette/backend')

from app.database.engine import SessionLocal
from app.models.models import Recipe

db = SessionLocal()

# Örnek tarifler
recipes = [
    Recipe(
        name="Pasta Carbonara",
        emoji="🍝",
        category="İtalyan",
        description="İtalya'nın en ünlü pasta tariflerinden biri",
        ingredients=["Spaghetti 400g", "Yumurta 4", "Parmesan peynir 100g", "Guanciale 200g"],
        instructions=[
            "Tuzlu su kaynatan tencereyi ısıtın",
            "Spagettini al dente oluncaya kadar pişirin",
            "Yumurta ve peynir karışımını hazırlayın",
            "Pastaları guanciale ve sos ile karıştırın"
        ],
        cook_time=20,
        difficulty="Kolay",
        servings=4,
        calories=450,
    ),
    Recipe(
        name="Biryani",
        emoji="🍲",
        category="Hintçe",
        description="Hint'in en meşhur pirinç yemeği",
        ingredients=["Basmati pirinç 400g", "Tavuk 800g", "Yoğurt 200ml", "Soğan 3", "Baharat karışımı 2 çay kaşığı"],
        instructions=[
            "Tavuğu yoğurt ve baharatlarla marine edin",
            "Pirinçi kaynatın",
            "Tavuk ve pirinçi tabakalamaya başlayın",
            "Az ateşte 45 dakika pişirin"
        ],
        cook_time=45,
        difficulty="Orta",
        servings=6,
        calories=380,
    ),
    Recipe(
        name="Pizza Margherita",
        emoji="🍕",
        category="İtalyan",
        description="Klasik İtalyan pizzası",
        ingredients=["Pizza hamuru 500g", "Domates salçası 100ml", "Mozzarella 300g", "Fesleğen", "Zeytinyağı 50ml"],
        instructions=[
            "Fırını 250°C'ye ısıtın",
            "Hamuru açın ve tepsiye koyun",
            "Salça sürün",
            "Mozzarella dökerek 12 dakika pişirin"
        ],
        cook_time=15,
        difficulty="Kolay",
        servings=4,
        calories=280,
    ),
    Recipe(
        name="Sushi",
        emoji="🍣",
        category="Japon",
        description="Japon'un geleneksel yemeği",
        ingredients=["Sushi pirinci 300g", "Nori 5 yaprak", "Avokado 1", "Balık 200g", "Sirke 50ml"],
        instructions=[
            "Pirinçi pişirin ve sirkeyle serinletin",
            "Nori'yi yemişler üzerine koyun",
            "Malzemeleri yerleştirin",
            "Sıkıca sarın ve kesmelik dilimleyin"
        ],
        cook_time=30,
        difficulty="Zor",
        servings=4,
        calories=200,
    ),
    Recipe(
        name="Steak",
        emoji="🥩",
        category="Amerikan",
        description="Mükemmel pişmiş et",
        ingredients=["Steak 800g", "Tuz", "Karabiber", "Sos soğanı 2", "Tereyağı 100g"],
        instructions=[
            "Eti oda sıcaklığına getirin",
            "Sıcak tavaya koyun 4 dakika",
            "Diğer tarafı pişirin",
            "Dinlendirine 5 dakika"
        ],
        cook_time=12,
        difficulty="Orta",
        servings=2,
        calories=500,
    ),
    Recipe(
        name="Tacos",
        emoji="🌮",
        category="Meksika",
        description="Meksika'nın en popüler yemeği",
        ingredients=["Tortilla 8", "Kıyma 500g", "Soğan 1", "Salsa 100ml", "Cheddar peynir 100g"],
        instructions=[
            "Kıymayı pişirin",
            "Tortillaları ısıtın",
            "Malzemeleri doldurun",
            "Salsa ile servis edin"
        ],
        cook_time=15,
        difficulty="Kolay",
        servings=4,
        calories=300,
    ),
    Recipe(
        name="Ramen",
        emoji="🍜",
        category="Japon",
        description="Japon erişte çorbası",
        ingredients=["Ramen 200g", "Tavuk suyu 1L", "Yumurta 2", "Sosisler 200g", "Yaşıl soğan 2"],
        instructions=[
            "Suyu kaynattın",
            "Ramen'i pişirin",
            "Yumurtaları poşe edin",
            "Hepsini kâsede birleştirin"
        ],
        cook_time=20,
        difficulty="Orta",
        servings=2,
        calories=350,
    ),
    Recipe(
        name="Curry",
        emoji="🍛",
        category="Hintçe",
        description="Hindistan'ın lezzet bombası",
        ingredients=["Tavuk 1kg", "Curry macunu 3 kaşık", "Süt 200ml", "Soğan 3", "Sarımsak 4 diş"],
        instructions=[
            "Soğan ve sarımsağı kızartın",
            "Curry macunu ekleyin",
            "Tavuğu ekleyin",
            "Süt ile pişirin 20 dakika"
        ],
        cook_time=30,
        difficulty="Orta",
        servings=6,
        calories=280,
    ),
]

try:
    # Mevcut tarifler varsa sil
    db.query(Recipe).delete()
    db.commit()
    
    # Yeni tarifler ekle
    for recipe in recipes:
        db.add(recipe)
    
    db.commit()
    print(f"✅ {len(recipes)} tarif başarıyla eklendi!")
    
except Exception as e:
    print(f"❌ Hata: {e}")
    db.rollback()
finally:
    db.close()
