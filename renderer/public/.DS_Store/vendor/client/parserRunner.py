from parser import Parser

SUPPORTED_LANGUAGES = ["en", "ru"]

if __name__ == "__main__":
    for lang in SUPPORTED_LANGUAGES:
        print(f"Generating {lang} tables")
        parser = Parser(lang)
        parser.run()
