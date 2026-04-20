#!/usr/bin/env python3
"""
Shopping Items Category Migration Script
Mevcut shopping items'ları malzeme adlarına göre kategorilere eşler
"""

import sys
from sqlalchemy import text
from app.database.engine import engine
from app.database.base import Base
from sqlalchemy.orm import Session

# Kategori eşlemeleri - item name'e göre kategori belirleme
CATEGORY_MAPPINGS = {
    'Sebze': [
        'domates', 'soğan', 'biber', 'patlıcan', 'kabak', 'patates', 'havuç', 
        'brokoli', 'karnabahar', 'spinach', 'ispanak', 'marul', 'lahana', 'salata',
        'ıspanak', 'sarımsak', 'ginger', 'zencefil', 'kıyılmış soğan', 'taze soğan',
        'sedef kabagu', 'kabak', 'turp', 'kimyon', 'semizotu', 'maydanoz', 'dill',
        'roka', 'enginarlı', 'enginar', 'kuşkonmaz', 'mantar', 'taze fasulye'
    ],
    'Meyve': [
        'elma', 'armut', 'şeftali', 'kayısı', 'kiraz', 'çilek', 'muz', 'portakal',
        'limon', 'greyfurt', 'lime', 'üzüm', 'karpuz', 'kavun', 'ananas', 'mango',
        'ahududu', 'kuşburnu', 'dut', 'nar', 'vişne', 'erik', 'hurma', 'kiwi',
        'avokado', 'kokonut', 'beyazön', 'incir', 'ceviz', 'fındık', 'badem'
    ],
    'Et/Balık': [
        'tavuk', 'tavuk göğsü', 'tavuk bacak', 'tavuk but', 'tavuk kanat', 'tavuk deri',
        'dana', 'dana eti', 'dana sucuk', 'dana kıyma', 'dana bonfile', 'dana antrikot',
        'koyun', 'kuzu', 'kuzu eti', 'kuzu kıyma', 'kuzu pirzola', 'kuzu but',
        'domuz', 'domuz eti', 'domuz kıyma', 'domuz pirzola', 'domuz göğsü',
        'balık', 'alabalık', 'levrek', 'çupra', 'hamsi', 'sardalya', 'ton balığı',
        'pazarbaşı', 'istavrit', 'pisi balık', 'turna', 'sazan', 'silüre', 'midye',
        'karides', 'istakoz', 'yengeç', 'ahtapot', 'mürekkep balığı', 'salyangoz',
        'güvercin', 'kaz', 'ördek', 'beş kız kardeş', 'hindi', 'keklik', 'bıldırcın',
        'kıyma', 'sucuk', 'sosis', 'salam', 'pastırma', 'jambön', 'bacon', 'proscuitto'
    ],
    'Süt Ürünleri': [
        'süt', 'milk', 'yoğurt', 'peynir', 'kaskaval', 'beyaz peynir', 'feta', 'tulum',
        'çedar', 'mozzarella', 'parmigiano', 'rikotta', 'mascarpone', 'labne', 'labneh',
        'quark', 'kaymak', 'krem', 'sour cream', 'açık krem', 'tereyağı', 'butter',
        'margarin', 'yağ', 'dil peyniri', 'beyazön peyniri', 'çerkez peyniri', 'lor',
        'süzme yoğurt', 'ayran', 'kefir', 'koumiss', 'ice cream', 'dondurma', 'pudding'
    ],
    'Baharatlar': [
        'tuz', 'baharat', 'karabiber', 'pul biber', 'kızıl biber', 'sumak', 'kırmızı pul',
        'safran', 'vanilya', 'tarçın', 'karanfil', 'muskat', 'köknar', 'anason', 'rezene',
        'kimyon', 'kişniş', 'kumin', 'tericiye', 'kırmızı pul biber', 'çili', 'paprika',
        'soya sosu', 'balık sosu', 'worcester', 'tabasco', 'harissa', 'za\'atar', 'dukkah',
        'summak', 'zatar', 'advieh', 'ras el hanout', 'garam masala', 'curry', 'turmeric',
        'öğütülmüş karabiber', 'tuz', 'tatlı baharat', 'yenibahar', 'defne yaprağı', 'kekik',
        'mayeran', 'nane', 'dil otu', 'rozet', 'lavanta', 'kişniş tohumları', 'terbiye'
    ],
    'Diğer': [
        'şeker', 'tatlı', 'bal', 'reçel', 'marmelat', 'marmalade', 'pekmez', 'tahini',
        'cacık', 'humus', 'tapenade', 'pesto', 'mayonez', 'ketçap', 'hardal', 'tuzlama',
        'sos', 'çeşni', 'un', 'ekmek', 'pasta', 'makarna', 'noodle', 'pirinç', 'bulgur',
        'mısır', 'bezelye', 'nohut', 'fasulye', 'mercimek', 'lentil', 'fırın', 'yeast',
        'maya', 'tat', 'yeast extract', 'malt extract', 'zeytin', 'zeytin yağı', 'ayçiçek yağı',
        'corn oil', 'olive oil', 'butter', 'bitkisel yağ', 'sarımsak pastası', 'ginger paste'
    ]
}

def get_category_for_item(item_name: str) -> str:
    """
    Item name'e göre kategori belirle
    """
    item_lower = item_name.lower().strip()
    
    for category, keywords in CATEGORY_MAPPINGS.items():
        for keyword in keywords:
            if keyword.lower() in item_lower:
                return category
    
    return 'Diğer'

def migrate_shopping_categories():
    """
    Shopping items kategorilerini güncelle
    """
    print("🔄 Shopping items kategorileri migration'ı başlıyor...")
    
    with Session(engine) as session:
        try:
            # Mevcut tüm shopping items'ları oku
            result = session.execute(
                text("SELECT id, item_name, category FROM shopping_items")
            )
            items = result.fetchall()
            
            print(f"📊 Toplam {len(items)} item bulundu\n")
            
            updated_count = 0
            
            for item_id, item_name, current_category in items:
                new_category = get_category_for_item(item_name)
                
                # Eğer kategori "Diğer" veya boş ise güncelle
                if current_category is None or current_category == 'Diğer' or current_category.strip() == '':
                    session.execute(
                        text(
                            "UPDATE shopping_items SET category = :category WHERE id = :id"
                        ),
                        {"category": new_category, "id": item_id}
                    )
                    updated_count += 1
                    print(f"✅ ID {item_id}: '{item_name}' → '{new_category}'")
                else:
                    print(f"⏭️  ID {item_id}: '{item_name}' → '{current_category}' (zaten set)")
            
            session.commit()
            print(f"\n✅ Migration başarılı! {updated_count} item güncellendi")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Migration hatası: {e}")
            raise

def verify_migration():
    """
    Migration sonrasında verileri doğrula
    """
    print("\n🔍 Verileri doğrulanıyor...\n")
    
    with Session(engine) as session:
        result = session.execute(
            text("""
                SELECT category, COUNT(*) as count 
                FROM shopping_items 
                GROUP BY category 
                ORDER BY count DESC
            """)
        )
        
        print("📊 Kategori Dağılımı:")
        for category, count in result.fetchall():
            print(f"   {category}: {count} item")

if __name__ == "__main__":
    try:
        migrate_shopping_categories()
        verify_migration()
        print("\n🎉 Tamamlandı!")
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        sys.exit(1)
