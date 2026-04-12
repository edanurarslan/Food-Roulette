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
        category="Ana Yemek",
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
        category="Ana Yemek",
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
        category="Ana Yemek",
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
        category="Ara Öğün",
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
        category="Ana Yemek",
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
        category="Ana Yemek",
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
        category="Çorba",
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
        category="Ana Yemek",
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
    # Kahvaltı kategorisi
    Recipe(
        name="Pancake",
        emoji="🥞",
        category="Kahvaltı",
        description="Klasik Amerikan pancakesi",
        ingredients=["Un 300g", "Yumurta 3", "Süt 400ml", "Şeker 50g", "Tuz 1 çay kaşığı", "Tozseker"],
        instructions=[
            "Kuru malzemeleri karıştırın",
            "Islak malzemeleri ayrı karıştırın",
            "Hepsini birleştirin",
            "Tavada pişirin"
        ],
        cook_time=15,
        difficulty="Kolay",
        servings=4,
        calories=250,
    ),
    Recipe(
        name="Menemen",
        emoji="🍳",
        category="Kahvaltı",
        description="Türk'ün sevdiği kahvaltı yemeği",
        ingredients=["Yumurta 5", "Domates 3", "Biber 2", "Soğan 1", "Kaşar peyniri 100g"],
        instructions=[
            "Domates, biber ve soğanı kesip kavurun",
            "Yumurtaları ekleyin",
            "Şakasına kadar pişirin",
            "Kaşar peynir serpin"
        ],
        cook_time=10,
        difficulty="Kolay",
        servings=3,
        calories=180,
    ),
    # Yan Yemek kategorisi
    Recipe(
        name="Çoban Salatası",
        emoji="🥗",
        category="Yan Yemek",
        description="Taze ve hafif salata",
        ingredients=["Domates 3", "Salatalık 2", "Soğan 1", "Maydanoz", "Limon", "Zeytinyağı"],
        instructions=[
            "Sebzeleri ince ince kesin",
            "Kâsede karıştırın",
            "Limon ve zeytinyağı dökün",
            "Tuzu ve biberi serpin"
        ],
        cook_time=5,
        difficulty="Kolay",
        servings=4,
        calories=120,
    ),
    Recipe(
        name="Fırın Patatesler",
        emoji="🥔",
        category="Yan Yemek",
        description="Çıtır pişmiş patates",
        ingredients=["Patates 800g", "Zeytinyağı 50ml", "Sarımsak 4 diş", "Rosemary", "Tuz ve biber"],
        instructions=[
            "Patatesleri küplendir",
            "Zeytinyağı ve bumastlarla karıştır",
            "Fırında 30 dakika pişir",
            "Sıcak servis et"
        ],
        cook_time=35,
        difficulty="Kolay",
        servings=4,
        calories=180,
    ),
    # Çorba kategorisine daha fazla tarif
    Recipe(
        name="Mercimek Çorbası",
        emoji="🍲",
        category="Çorba",
        description="Türk'ün klasik çorbası",
        ingredients=["Kırmızı mercimek 250g", "Su 1L", "Soğan 1", "Havuç 1", "Tuz ve biber"],
        instructions=[
            "Mercimekleri durulayın",
            "Sebzelerle birlikte kaynatın",
            "Pişene kadar bekleyin",
            "Püre yapın ve servis edin"
        ],
        cook_time=25,
        difficulty="Kolay",
        servings=4,
        calories=150,
    ),
    Recipe(
        name="Domates Çorbası",
        emoji="🍅",
        category="Çorba",
        description="Hafif ve lezzetli domates çorbası",
        ingredients=["Domates 800g", "Tavuk suyu 1L", "Krema 200ml", "Soğan 1", "Sarımsak 2 diş"],
        instructions=[
            "Domatesleri kaynatın",
            "Suyu ekleyin",
            "Blenderden geçirin",
            "Krema ekleyip ısıtın"
        ],
        cook_time=20,
        difficulty="Kolay",
        servings=4,
        calories=120,
    ),
    # Ara Öğün kategorisine daha fazla
    Recipe(
        name="Hummus",
        emoji="🫘",
        category="Ara Öğün",
        description="Nohut ezmesi",
        ingredients=["Nohut 400g", "Tahini 100g", "Limon 2", "Sarımsak 2 diş", "Zeytinyağı"],
        instructions=[
            "Nohutları blenderden geçirin",
            "Tahini ekleyin",
            "Limon suyu ve sarımsağı karıştırın",
            "Zeytinyağıyla servis edin"
        ],
        cook_time=5,
        difficulty="Kolay",
        servings=6,
        calories=180,
    ),
    Recipe(
        name="Mini Pide",
        emoji="🥐",
        category="Ara Öğün",
        description="Küçük boy pide",
        ingredients=["Hamur 500g", "Peynir 200g", "Kaş 50g", "Yumurta 2"],
        instructions=[
            "Hamuru kesip şekil verin",
            "Peynir ve kaş doldurun",
            "Yumurta sürün",
            "Fırında 20 dakika pişirin"
        ],
        cook_time=25,
        difficulty="Orta",
        servings=4,
        calories=280,
    ),
    # Ek Ana Yemek Tarifler
    Recipe(
        name="Fırın Tavuğu",
        emoji="🍗",
        category="Ana Yemek",
        description="Limonlu ve baharatlı fırında pişmiş tavuk",
        ingredients=["Tavuk 1.5kg", "Limon 3", "Soğan 2", "Sarımsak 6 diş", "Zeytin yağı 100ml", "Rigani 2 çay kaşığı"],
        instructions=[
            "Tavuğu temizleyin ve yarıya bölün",
            "Limon, sarımsak ve riganiyle yağlayın",
            "Soğanları etrafına yerleştirin",
            "180°C'de 1 saat pişirin",
            "Altın rengine dönünce çıkarın"
        ],
        cook_time=70,
        difficulty="Kolay",
        servings=4,
        calories=320,
    ),
    Recipe(
        name="Kızırtma",
        emoji="🍲",
        category="Ana Yemek",
        description="Türk'ün geleneksel et yemeği",
        ingredients=["Dana eti 1kg", "Soğan 4", "Domates 3", "Biber 2", "Tuz", "Siyah biber", "Zeytinyağı 100ml"],
        instructions=[
            "Eti küplendir ve kızart",
            "Soğanları ekle",
            "Domates ve biberi koy",
            "Kapalı kapta 1.5 saat pişir",
            "Sıcak servis et"
        ],
        cook_time=90,
        difficulty="Orta",
        servings=6,
        calories=280,
    ),
    Recipe(
        name="Moussaka",
        emoji="🍆",
        category="Ana Yemek",
        description="Yunan'ın meşhur patlıcan yemeği",
        ingredients=["Patlıcan 3", "Kıyma 500g", "Domates 4", "Beyaz sos malz. 300ml", "Peynir 200g"],
        instructions=[
            "Patlıcanleri dilimle ve kızart",
            "Kıymayı kızart ve domates ekle",
            "Katmanlı şekilde diz",
            "Beyaz sosla örtüyü kapatıp pişir",
            "Altın rengi olana kadar fırında pişir"
        ],
        cook_time=60,
        difficulty="Orta",
        servings=6,
        calories=250,
    ),
    Recipe(
        name="Pad Thai",
        emoji="🍜",
        category="Ana Yemek",
        description="Tayland'ın ünlü erişte yemeği",
        ingredients=["Pirinç erişte 300g", "Tavuk 400g", "Karides 200g", "Yumurta 2", "Sosisler 3", "Sos 4 kaşık"],
        instructions=[
            "Erişteleri pişir",
            "Tavuk ve karidesleri kızart",
            "Yumurtayı ekle",
            "Erişteleri sos ile karıştır",
            "Sıcak servis et"
        ],
        cook_time=20,
        difficulty="Orta",
        servings=4,
        calories=420,
    ),
    Recipe(
        name="Falafel",
        emoji="🫓",
        category="Ana Yemek",
        description="Nohut köftesi - Ortadoğu'nun klasiği",
        ingredients=["Nohut 500g", "Soğan 2", "Sarımsak 3 diş", "Maydanoz 1 demet", "Un 100g", "Baharat karışımı"],
        instructions=[
            "Nohutları (kaynamamış) blenderden geçir",
            "Soğan, sarımsak ve maydanozu ekle",
            "Baharat ve un karıştır",
            "Köfteler şekil ver ve kızart",
            "Sıcak servis et"
        ],
        cook_time=25,
        difficulty="Orta",
        servings=4,
        calories=280,
    ),
    # Ek Çorba Tarifler
    Recipe(
        name="Tavuk Çorbası",
        emoji="🍲",
        category="Çorba",
        description="Sağlıklı ve besleyici tavuk çorbası",
        ingredients=["Tavuk 600g", "Tavuk suyu 1.5L", "Havuç 2", "Patates 2", "Soğan 1", "Nişasta 2 çay kaşığı"],
        instructions=[
            "Tavuğu suyla birlikte kaynat",
            "Havuç ve patates ekle",
            "30 dakika pişir",
            "Tavuğu sıyır ve parçala",
            "Nişastayla koy ve kaynat"
        ],
        cook_time=35,
        difficulty="Kolay",
        servings=4,
        calories=140,
    ),
    Recipe(
        name="Şehriye Çorbası",
        emoji="🍝",
        category="Çorba",
        description="Türk'ün sevdiği basit çorba",
        ingredients=["Şehriye 200g", "Tavuk suyu 1L", "Tereyağı 50g", "Domates salçası 2 kaşık", "Tuz"],
        instructions=[
            "Tereyağını eritin",
            "Şehriyeyi kızart",
            "Domates salçası ekle",
            "Suyu dök ve kaynat",
            "15 dakika pişir"
        ],
        cook_time=18,
        difficulty="Kolay",
        servings=4,
        calories=160,
    ),
    Recipe(
        name="Pumpkin Soup",
        emoji="🎃",
        category="Çorba",
        description="Balkabalak çorbası - Sonbahar lezzeti",
        ingredients=["Balkabalak 1kg", "Zeytinyağı 50ml", "Soğan 2", "Krema 200ml", "Bouillon 1L", "Beyaz barbekü"],
        instructions=[
            "Balkabalağı küplendir",
            "Soğan ve balkabalağı kızart",
            "Buillonu dök",
            "30 dakika pişir ve püre yap",
            "Krema ekle ve ısıt"
        ],
        cook_time=40,
        difficulty="Kolay",
        servings=4,
        calories=180,
    ),
    # Ek Kahvaltı Tarifler
    Recipe(
        name="Kızartmalı Ekmek",
        emoji="🍞",
        category="Kahvaltı",
        description="Yumurtalı kızartmalı ekmek",
        ingredients=["Beyaz ekmek 4 dilim", "Yumurta 3", "Süt 100ml", "Tereyağı 50g", "Tarçın", "Şeker"],
        instructions=[
            "Yumurta ve sütü karıştır",
            "Ekmekleri daldır",
            "Tereyağında kızart",
            "Altın rengi olana kadar pişir",
            "Tarçın ve şekerle servis et"
        ],
        cook_time=10,
        difficulty="Kolay",
        servings=2,
        calories=320,
    ),
    Recipe(
        name="Tost",
        emoji="🧀",
        category="Kahvaltı",
        description="Peynir ve sosisle yapılan tost",
        ingredients=["Ekmek 4 dilim", "Kaşar peynir 200g", "Sosis 2", "Tereyağı 30g", "Domates 1"],
        instructions=[
            "Sosisleri dilimlendirin",
            "Ekmek dilimlerine peynir ve sosis koyun",
            "Üstüne ekmek koyup tereyağında kızartın",
            "İki tarafı da altın rengi olana kadar pişirin",
            "Sıcak servis edin"
        ],
        cook_time=8,
        difficulty="Kolay",
        servings=2,
        calories=420,
    ),
    Recipe(
        name="Omlet",
        emoji="🥚",
        category="Kahvaltı",
        description="Klasik yumurta omleti",
        ingredients=["Yumurta 4", "Tereyağı 30g", "Peynir 100g", "Biber 1", "Soğan 0.5", "Tuz ve biber"],
        instructions=[
            "Yumurtaları çıktırın",
            "Biber ve soğanı ince doğrayın",
            "Tereyağında sebzeleri kızartın",
            "Yumurtaları dökün",
            "Peynir serip katla ve servis et"
        ],
        cook_time=8,
        difficulty="Kolay",
        servings=2,
        calories=280,
    ),
    # Ek Ara Öğün Tarifler
    Recipe(
        name="Saç Böreği",
        emoji="🥐",
        category="Ara Öğün",
        description="İnce yufkalı peynirli börek",
        ingredients=["Yufka 4 yaprak", "Peynir 300g", "Maydanoz 1 demet", "Yumurta 1", "Tereyağı 100ml"],
        instructions=[
            "Peynir ve maydanoz karışımı hazırla",
            "Yufkaları tereyağla kaplı tavaya koy",
            "Peynir karışımı döşe",
            "Yufka ile örtü",
            "20 dakika pişir"
        ],
        cook_time=22,
        difficulty="Orta",
        servings=4,
        calories=320,
    ),
    Recipe(
        name="Mozzarella Çubukları",
        emoji="🧀",
        category="Ara Öğün",
        description="Kırmızı mozzarella panerine sarılı",
        ingredients=["Mozzarella 300g", "Panir unu", "Yumurta 2", "Zeytinyağı 100ml"],
        instructions=[
            "Mozzareliları çubuk şekil ver",
            "Yumurtaya batır",
            "Panir ununa hadde et",
            "Derin yağda kızart",
            "Sıcak servis et"
        ],
        cook_time=10,
        difficulty="Kolay",
        servings=3,
        calories=340,
    ),
    Recipe(
        name="Yaprak Sarması",
        emoji="🌿",
        category="Ara Öğün",
        description="Üzüm yaprağına sarılmış pirinç",
        ingredients=["Üzüm yaprağı 30 yaprak", "Pirinç 300g", "Kıyma 200g", "Soğan 2", "Domates 2", "Baharat"],
        instructions=[
            "Pirinç ve kıymayı baharat ile karıştır",
            "Yaprağa sarı ve rulo şekil ver",
            "Kâsede sırası ile diz",
            "Domates suyu dök",
            "1 saat pişir"
        ],
        cook_time=65,
        difficulty="Orta",
        servings=6,
        calories=200,
    ),
    # Ek Yan Yemek Tarifler
    Recipe(
        name="Ayran Patlıcan",
        emoji="🍆",
        category="Yan Yemek",
        description="Ayran soslu patlıcan mezesi",
        ingredients=["Patlıcan 2", "Ayran 200ml", "Sarımsak 3 diş", "Domates 1", "Yeşil soğan 2"],
        instructions=[
            "Patlıcanı kızart",
            "Ayran ve sarımsağı karıştır",
            "Patlıcana dök",
            "Domates ve yeşil soğanla süsle",
            "Soğuk servis et"
        ],
        cook_time=15,
        difficulty="Kolay",
        servings=4,
        calories=140,
    ),
    Recipe(
        name="Patates Salatası",
        emoji="🥔",
        category="Yan Yemek",
        description="Mayonezli patates salatası",
        ingredients=["Patates 800g", "Mayonez 200ml", "Kornişon 100g", "Soğan 1", "Maydanoz"],
        instructions=[
            "Patatesleri kaynat ve kesin",
            "Mayonezle karıştır",
            "Kornişon ve soğan ekle",
            "Maydanozla süsle",
            "Soğuk servis et"
        ],
        cook_time=20,
        difficulty="Kolay",
        servings=6,
        calories=220,
    ),
    Recipe(
        name="Pilav",
        emoji="🍚",
        category="Yan Yemek",
        description="Türk pilavı",
        ingredients=["Pirinç 300g", "Tavuk suyu 600ml", "Tereyağı 50g", "Soğan 1", "Tuz"],
        instructions=[
            "Tereyağında soğan kızart",
            "Pirinç ekle ve 2 dakika karıştır",
            "Suyu dök",
            "Kaynayınca ateşi kıs",
            "15 dakika pişir"
        ],
        cook_time=20,
        difficulty="Kolay",
        servings=4,
        calories=280,
    ),
    Recipe(
        name="Bulgur Pilavı",
        emoji="🌾",
        category="Yan Yemek",
        description="Bulgur buğdayından yapılan pilav",
        ingredients=["Bulgur 300g", "Tavuk suyu 600ml", "Soğan 1", "Tereyağı 50g", "Baharat"],
        instructions=[
            "Bulguru tereyağında kızart",
            "Soğanları ekle",
            "Suyu dök ve baharat ekle",
            "Kaynayınca ateşi kıs",
            "10 dakika pişir"
        ],
        cook_time=15,
        difficulty="Kolay",
        servings=4,
        calories=240,
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
