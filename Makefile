BIN = ./node_modules/.bin
SRC = $(wildcard src/* src/*/*)

build: index.js cli.js client.js client.css

index.js: src/index.js $(SRC)
	TARGET=node $(BIN)/rollup $< -c -f cjs > $@

cli.js: src/cli.js $(SRC)
	echo "#!/usr/bin/env node" > $@
	TARGET=node $(BIN)/rollup $< -c -f cjs >> $@

client.js: src/client/index.html
	TARGET=browser $(BIN)/rollup $< -c -f cjs > $@

client.css: src/client/index.scss
	$(BIN)/node-sass --importer build/sass-module-importer.js $< | $(BIN)/postcss --use autoprefixer --autoprefixer.browsers "ie >= 8,> 1%" | $(BIN)/cleancss > $@

clean:
	rm index.js cli.js client.js client.css

.PHONY: build
