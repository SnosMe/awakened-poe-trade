
echo "Copying files from EXPORT/tables/English to data/en"
cp -R EXPORT/tables/English/* vendor/client/tables/en/

echo "Copying files from EXPORT/tables/Russian to data/ru"
cp -R EXPORT/tables/Russian/* vendor/client/tables/ru/

echo "Copying files from EXPORT/tables/Korean to data/ko"
cp -R EXPORT/tables/Korean/* vendor/client/tables/ko/

echo "Copying files from EXPORT/tables/Traditional Chinese to data/cmn-Hant"
cp -R EXPORT/tables/Traditional\ Chinese/* vendor/client/tables/cmn-Hant/

echo "Copying files from EXPORT/tables/Japanese to data/ja"
cp -R EXPORT/tables/Japanese/* vendor/client/tables/ja/

echo "Copying files from EXPORT/tables/German to data/de"
cp -R EXPORT/tables/German/* vendor/client/tables/de/

echo "Copying not generated files from english to other languages"

# Copy without overwriting English -> data/ru
cp -n vendor/client/tables/en/* vendor/client/tables/ru/
cp -n vendor/client/tables/en/* vendor/client/tables/ko/
cp -n vendor/client/tables/en/* vendor/client/tables/cmn-Hant/
cp -n vendor/client/tables/en/* vendor/client/tables/ja/
cp -n vendor/client/tables/en/* vendor/client/tables/de/

# Copy description files from EXPORT/files to client/descriptions
echo "Copying description files from EXPORT/files to client/descriptions"
cp -R EXPORT/files/* vendor/client/descriptions/
