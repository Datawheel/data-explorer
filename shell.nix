with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "node";
  buildInputs = [
    nodejs_20
  ];
  shellHook = ''
    export DAEX_TESSERACT_SERVER="https://datasaudi-pytesseract-dev.datawheel.us/tesseract/"
  '';
}
