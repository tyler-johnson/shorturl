BIN = ./node_modules/.bin
SRC = $(wildcard src/*)

build: index.js cli.js dist/client.js dist/client.css

index.js: src/index.js $(SRC)
	TARGET=node $(BIN)/rollup $< -c -f cjs > $@

cli.js: src/cli.js $(SRC)
	echo "#!/usr/bin/env node" > $@
	TARGET=node $(BIN)/rollup $< -c -f cjs >> $@

dist:
	mkdir -p dist

dist/client.js: src/client/index.html dist
	TARGET=browser $(BIN)/rollup $< -c -f cjs | $(BIN)/uglifyjs -m -c warnings=false > $@

dist/client.css: src/client/index.scss dist
	$(BIN)/node-sass --importer build/sass-module-importer.js $< | $(BIN)/postcss --use autoprefixer --autoprefixer.browsers "ie >= 8,> 1%" | $(BIN)/cleancss > $@

clean:
	rm index.js cli.js dist/client.js dist/client.css

.PHONY: build
