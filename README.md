# Charset Auto Select

Simple extension to reopen files in the correct charset

(sad that I need to build this)

## How it works:

The idea is to change de vscode settings file with the correct encoding,
and then reopens de file with the charset output from 

```
file -bi ${filename} | awk '{print toupper($0)}' | cut -d'=' -f2
```

## How the logic works

Simple, if there is a known output, utf-8 or iso-8859-1 the extension changes
the settings file with the matching output.

But,

IF it finds a ASCII/US-ACII charset (may happen due to creating on windows or ssh)

**THEN** it will check for a root project file **.ci-charset-exclude**
**IF** this file exists, assume *ALL FILES, EXCEPT BY ONES IN THE ci-charset-exclude FILE* are iso-8859-1
**ELSE** it *assumes that ALL PROJECT FILES* are utf8