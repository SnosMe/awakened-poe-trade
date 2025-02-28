

supported_languages=("en" "ru" "ko" "cmn-Hant" "ja" "de" "es")

for lang in "${supported_languages[@]}"; do
    echo "Copying $lang"
    cp -R ./vendor/client/pyDumps/$lang/* ./data/$lang/
done

echo "Copying Generic Data"
cp -R ./vendor/client/pyDumps/generic/* ./data/generic/