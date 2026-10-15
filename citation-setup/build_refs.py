#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate refs.generated.js from the slides' data-cite keys and a .bib file.

Scans the deck's HTML for data-cite keys, pulls those entries out of the
BibTeX file, formats each one, and writes them to a JavaScript file that the
deck loads with a plain <script> tag.

Standard library only -- nothing to install.

    python citation-setup/build_refs.py

The paths it uses are fixed, just below: the deck's index.html, and the
project's bib/ folder for the .bib it reads and the file it writes. They are
resolved relative to this file, so the command works from any directory.

See README.md for what the warnings mean.
"""

import html
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

# --- Configuration -----------------------------------------------------------
# Paths are resolved relative to this file, so the script runs from anywhere.

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                      # the project, which holds this folder

# The project's references live in its own bib/ folder, as its figures live in
# fig/ and its equations in eqn/, so this folder holds only code and can be
# copied from project to project untouched.
HTML_FILE = ROOT / "index.html"
BIB_FILE = ROOT / "bib" / "refs.bib"
OUT_FILE = ROOT / "bib" / "refs.generated.js"

# Authors listed in full before the list is cut short with "et al."
MAX_AUTHORS = 3

# Entry types with a template. Anything else falls back to the article shape
# and is reported.
KNOWN_TYPES = ("article", "inproceedings", "book")

# Which field carries the venue, per entry type.
VENUE_FIELD = {
    "article": "journal",
    "inproceedings": "booktitle",
    "book": "publisher",
}


# --- Reporting ---------------------------------------------------------------

class Report:
    """Collects warnings so the run ends with one readable summary."""

    def __init__(self):
        self.warnings = []
        self.errors = []

    def warn(self, message):
        self.warnings.append(message)

    def error(self, message):
        self.errors.append(message)


# --- Step 1: find the cited keys in the HTML ---------------------------------

class CiteScanner(HTMLParser):
    """Collects every key in every data-cite attribute, in document order."""

    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.keys = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == "data-cite" and value:
                for key in re.split(r"[\s,]+", value.strip()):
                    if key:
                        self.keys.append(key)


def find_cited_keys(html_path, report):
    """Return the cited keys, de-duplicated, in order of first appearance."""
    try:
        source = html_path.read_text(encoding="utf-8")
    except OSError as exc:
        report.error("cannot read %s (%s)" % (html_path, exc))
        return []

    scanner = CiteScanner()
    scanner.feed(source)

    seen = set()
    ordered = []
    for key in scanner.keys:
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return ordered


# --- Step 2: parse the .bib --------------------------------------------------

ENTRY_START = re.compile(r"@([A-Za-z]+)\s*\{", re.MULTILINE)

# Entry types that carry no bibliography data.
SKIP_TYPES = ("comment", "preamble", "string")


def _match_brace(text, start):
    """Index just past the '}' matching the '{' at `start`, or -1."""
    depth = 0
    i = start
    n = len(text)
    while i < n:
        char = text[i]
        if char == "\\":
            i += 2
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def _split_top_level(text, separator=","):
    """Split on `separator`, ignoring any inside braces or quotes."""
    parts = []
    depth = 0
    in_quote = False
    start = 0
    i = 0
    n = len(text)
    while i < n:
        char = text[i]
        if char == "\\":
            i += 2
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        elif char == '"' and depth == 0:
            in_quote = not in_quote
        elif char == separator and depth == 0 and not in_quote:
            parts.append(text[start:i])
            start = i + 1
        i += 1
    parts.append(text[start:])
    return parts


def _resolve_value(raw, strings, report, where):
    """Turn a raw field value into text.

    A value is one or more parts joined by '#': a braced or quoted string, a
    number, or the name of an @string abbreviation to look up.
    """
    parts = []
    problems = []

    for piece in _split_top_level(raw, "#"):
        piece = piece.strip()
        if not piece:
            continue

        if piece[0] == "{" and _match_brace(piece, 0) == len(piece):
            parts.append(piece[1:-1])
        elif len(piece) > 1 and piece[0] == '"' and piece[-1] == '"':
            parts.append(piece[1:-1])
        elif piece.isdigit():
            parts.append(piece)
        else:
            value = strings.get(piece.lower())
            if value is None:
                problems.append(
                    "uses the abbreviation '%s', which has no @string "
                    "definition" % piece
                )
                parts.append(piece)
            else:
                parts.append(value)

    if where is not None:
        for problem in problems:
            report.warn("%s %s" % (where, problem))

    return "".join(parts).strip(), problems


def _iter_blocks(source, report, name):
    """Yield (type, body) for every @... block in the file."""
    blocks = []
    position = 0
    while True:
        match = ENTRY_START.search(source, position)
        if not match:
            return blocks

        brace = match.end() - 1
        end = _match_brace(source, brace)
        if end == -1:
            report.warn(
                "unbalanced braces at or after character %d of %s -- "
                "everything from there on was skipped" % (match.start(), name)
            )
            return blocks

        position = end
        blocks.append((match.group(1).lower(), source[brace + 1:end - 1]))


def parse_bib(bib_path, report):
    """Return ({key: (type, fields, problems)}, number of abbreviations).

    Two passes: @string definitions are collected first, so an entry may use an
    abbreviation defined anywhere in the file. Each entry carries its own list
    of problems, reported only if that entry turns out to be cited -- an entry
    nobody cites is never anybody's problem, which is how BibTeX behaves too.
    """
    try:
        source = bib_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        report.error(
            "%s is not valid UTF-8. Re-save it as UTF-8 and run again." % bib_path
        )
        return {}, 0
    except OSError as exc:
        report.error("cannot read %s (%s)" % (bib_path, exc))
        return {}, 0

    blocks = _iter_blocks(source, report, bib_path.name)

    # Pass 1: the abbreviations. Each is resolved against the ones already
    # seen, so one may be built from another.
    strings = {}
    for entry_type, body in blocks:
        if entry_type != "string":
            continue
        name, separator, value = body.partition("=")
        name = name.strip().lower()
        if not name or not separator:
            continue
        strings[name], _ = _resolve_value(
            value, strings, report, "@string %s:" % name
        )

    # Pass 2: the entries.
    entries = {}
    for entry_type, body in blocks:
        if entry_type in SKIP_TYPES:
            continue

        chunks = _split_top_level(body)
        key = chunks[0].strip()
        if not key:
            continue
        if key in entries:
            report.warn("duplicate key '%s' in %s -- the first one wins"
                        % (key, bib_path.name))
            continue

        fields = {}
        problems = []
        for chunk in chunks[1:]:
            if "=" not in chunk:
                continue
            name, _, value = chunk.partition("=")
            name = name.strip().lower()
            if not name:
                continue
            fields[name], trouble = _resolve_value(value, strings, report, None)
            problems.extend(trouble)

        entries[key] = (entry_type, fields, problems)

    return entries, len(strings)


# --- Step 3: LaTeX to plain text ---------------------------------------------

# Combining marks, applied to the following letter and then normalized, which
# covers every accented letter without a table of its own.
ACCENT_MARKS = {
    '"': "\u0308",   # diaeresis
    "'": "\u0301",   # acute
    "`": "\u0300",   # grave
    "^": "\u0302",   # circumflex
    "~": "\u0303",   # tilde
    "=": "\u0304",   # macron
    ".": "\u0307",   # dot above
    "c": "\u0327",   # cedilla
    "v": "\u030C",   # caron
    "u": "\u0306",   # breve
    "H": "\u030B",   # double acute
    "r": "\u030A",   # ring above
    "k": "\u0328",   # ogonek
    "d": "\u0323",   # dot below
    "b": "\u0331",   # macron below
}

# Commands that stand for a character.
COMMAND_CHARS = {
    "ss": "\u00df", "aa": "\u00e5", "AA": "\u00c5", "o": "\u00f8", "O": "\u00d8",
    "l": "\u0142", "L": "\u0141", "ae": "\u00e6", "AE": "\u00c6",
    "oe": "\u0153", "OE": "\u0152", "i": "i", "j": "j",
    "copyright": "\u00a9", "dag": "\u2020", "ddag": "\u2021", "P": "\u00b6",
    "S": "\u00a7", "pounds": "\u00a3", "textquotesingle": "'",
    "textquotedblleft": "\u201c", "textquotedblright": "\u201d",
    "textendash": "\u2013", "textemdash": "\u2014", "textdegree": "\u00b0",
    "degree": "\u00b0", "circ": "\u00b0", "textmu": "\u00b5",
    "times": "\u00d7", "cdot": "\u00b7", "pm": "\u00b1", "mp": "\u2213",
    "approx": "\u2248", "sim": "\u223c", "neq": "\u2260", "leq": "\u2264",
    "geq": "\u2265", "ll": "\u226a", "gg": "\u226b", "infty": "\u221e",
    "partial": "\u2202", "nabla": "\u2207", "sum": "\u2211", "prod": "\u220f",
    "int": "\u222b", "sqrt": "\u221a", "rightarrow": "\u2192", "to": "\u2192",
    "leftarrow": "\u2190", "leftrightarrow": "\u2194", "ldots": "\u2026",
    "dots": "\u2026", "alpha": "\u03b1", "beta": "\u03b2", "gamma": "\u03b3",
    "delta": "\u03b4", "epsilon": "\u03b5", "varepsilon": "\u03b5",
    "zeta": "\u03b6", "eta": "\u03b7", "theta": "\u03b8", "iota": "\u03b9",
    "kappa": "\u03ba", "lambda": "\u03bb", "mu": "\u03bc", "nu": "\u03bd",
    "xi": "\u03be", "pi": "\u03c0", "rho": "\u03c1", "sigma": "\u03c3",
    "tau": "\u03c4", "upsilon": "\u03c5", "phi": "\u03c6", "varphi": "\u03c6",
    "chi": "\u03c7", "psi": "\u03c8", "omega": "\u03c9", "Gamma": "\u0393",
    "Delta": "\u0394", "Theta": "\u0398", "Lambda": "\u039b", "Xi": "\u039e",
    "Pi": "\u03a0", "Sigma": "\u03a3", "Upsilon": "\u03a5", "Phi": "\u03a6",
    "Psi": "\u03a8", "Omega": "\u03a9",
}

# Commands whose braced argument is kept and whose name is dropped. The deck
# has no italic or bold inside a reference, so these all flatten to text.
WRAPPER_COMMANDS = (
    "emph", "textit", "textbf", "textrm", "textsc", "textsl", "texttt",
    "textnormal", "text", "mbox", "hbox", "mathrm", "mathit", "mathbf",
    "mathcal", "mathsf", "ensuremath", "lowercase", "uppercase", "MakeLowercase",
    "MakeUppercase", "url", "href", "textsuperscript", "textsubscript",
)

ESCAPED_CHARS = {
    r"\&": "&", r"\%": "%", r"\_": "_", r"\#": "#", r"\$": "$",
    r"\{": "{", r"\}": "}", r"\textbackslash": "\\",
}

SUBSCRIPT = {
    "0": "\u2080", "1": "\u2081", "2": "\u2082", "3": "\u2083", "4": "\u2084",
    "5": "\u2085", "6": "\u2086", "7": "\u2087", "8": "\u2088", "9": "\u2089",
    "+": "\u208a", "-": "\u208b", "=": "\u208c", "(": "\u208d", ")": "\u208e",
    "n": "\u2099", "x": "\u2093", "i": "\u1d62",
}

SUPERSCRIPT = {
    "0": "\u2070", "1": "\u00b9", "2": "\u00b2", "3": "\u00b3", "4": "\u2074",
    "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079",
    "+": "\u207a", "-": "\u207b", "=": "\u207c", "(": "\u207d", ")": "\u207e",
    "n": "\u207f", "i": "\u2071",
}

RE_ACCENT_SYMBOL = re.compile(r"\\([\"'`^~=.])\s*\{?\s*(\\[ij]|[A-Za-z])\s*\}?")
RE_ACCENT_NAMED = re.compile(r"\\([cvuHrkdb])\s*\{\s*(\\[ij]|[A-Za-z])\s*\}")
RE_COMMAND = re.compile(r"\\([A-Za-z]+)\s?")
# Not after a backslash: \_ is an escaped underscore, unescaped further down.
RE_SCRIPT = re.compile(r"(?<!\\)([_^])\s*(?:\{([^{}]*)\}|(\S))")


def _apply_accent(letter, mark):
    if letter in ("\\i", "\\j"):
        letter = letter[1]
    return unicodedata.normalize("NFC", letter + mark)


def _strip_wrappers(text):
    """Replace \\emph{x} and friends with x, innermost first."""
    for _ in range(12):  # bounded: nesting deeper than this is not real
        changed = False
        for command in WRAPPER_COMMANDS:
            marker = "\\" + command
            index = text.find(marker)
            while index != -1:
                after = index + len(marker)
                # Only a whole command name, not a prefix of a longer one.
                if after < len(text) and text[after].isalpha():
                    index = text.find(marker, after)
                    continue
                brace = after
                while brace < len(text) and text[brace] in " \t":
                    brace += 1
                if brace < len(text) and text[brace] == "{":
                    end = _match_brace(text, brace)
                    if end != -1:
                        text = text[:index] + text[brace + 1:end - 1] + text[end:]
                        changed = True
                        index = text.find(marker, index)
                        continue
                index = text.find(marker, after)
        if not changed:
            break
    return text


def _convert_scripts(text):
    def replace(match):
        body = match.group(2) if match.group(2) is not None else match.group(3)
        table = SUBSCRIPT if match.group(1) == "_" else SUPERSCRIPT
        if body and all(char in table for char in body):
            return "".join(table[char] for char in body)
        return body or ""
    return RE_SCRIPT.sub(replace, text)


def delatex(raw, key, field, report):
    """Turn a raw BibTeX field into plain Unicode text."""
    if not raw:
        return ""

    text = re.sub(r"\s+", " ", raw).strip()
    text = _strip_wrappers(text)
    text = RE_ACCENT_NAMED.sub(lambda m: _apply_accent(m.group(2), ACCENT_MARKS[m.group(1)]), text)
    text = RE_ACCENT_SYMBOL.sub(lambda m: _apply_accent(m.group(2), ACCENT_MARKS[m.group(1)]), text)
    text = _convert_scripts(text)
    text = RE_COMMAND.sub(
        lambda m: COMMAND_CHARS.get(m.group(1), m.group(0)), text
    )
    # Math delimiters go before \$ is un-escaped, so a literal dollar survives.
    text = re.sub(r"(?<!\\)\$", "", text)
    for source, target in ESCAPED_CHARS.items():
        text = text.replace(source, target)
    text = text.replace("---", "\u2014").replace("--", "\u2013")
    text = text.replace("``", "\u201c").replace("''", "\u201d")
    text = text.replace("~", "\u00a0")
    text = text.replace("{", "").replace("}", "")
    text = re.sub(r"\s+", " ", text).strip()

    if "\\" in text:
        report.warn(
            "'%s' (%s): could not convert every LaTeX command -- the reference "
            "will read: %s" % (key, field, text)
        )

    return text


def esc(text):
    """HTML-escape a converted field so it is safe in innerHTML."""
    return html.escape(text, quote=False)


# --- Step 4: author names ----------------------------------------------------

def _split_authors(raw):
    """Split an author field on ' and ', ignoring any inside braces."""
    parts = []
    current = []
    depth = 0
    i = 0
    n = len(raw)
    while i < n:
        char = raw[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        if depth == 0 and raw[i:i + 5].lower() == " and ":
            parts.append("".join(current))
            current = []
            i += 5
            continue
        current.append(char)
        i += 1
    parts.append("".join(current))
    return [part.strip() for part in parts if part.strip()]


def _initials(given):
    out = []
    for token in given.replace(".", " ").split():
        if "-" in token:
            pieces = [p for p in token.split("-") if p]
            out.append("-".join(p[0].upper() + "." for p in pieces))
        else:
            out.append(token[0].upper() + ".")
    return " ".join(out)


def _format_name(name):
    """Turn one BibTeX name into 'J. Smith'."""
    if "," in name:
        chunks = [chunk.strip() for chunk in name.split(",")]
        family = chunks[0]
        given = chunks[-1] if len(chunks) > 1 else ""
        if len(chunks) > 2:                      # Last, Jr., First
            family = family + " " + chunks[1]
    else:
        tokens = name.split()
        if len(tokens) == 1:
            return tokens[0]
        # BibTeX's rule: the family name starts at the first word beginning with
        # a lowercase letter, so 'van den Berg' stays together while 'Bin Wu'
        # is a given name and a surname. A word list cannot tell those apart.
        start = len(tokens) - 1
        for index in range(len(tokens) - 1):
            if tokens[index][:1].islower():
                start = index
                break
        family = " ".join(tokens[start:])
        given = " ".join(tokens[:start])

    given = _initials(given)
    return (given + " " + family).strip() if given else family


def format_authors(raw, key, report):
    if not raw:
        return ""

    # A wrapped author field puts a newline between "and" and the next name, so
    # the separator has to be normalized before anything looks for it.
    raw = re.sub(r"\s+", " ", raw).strip()

    names = []
    truncated = False
    for name in _split_authors(raw):
        if name.lower() in ("others", "et al.", "et al"):
            truncated = True
            continue
        names.append(_format_name(delatex(name, key, "author", report)))

    if not names:
        return ""

    if len(names) > MAX_AUTHORS:
        names = names[:MAX_AUTHORS]
        truncated = True

    names = [esc(name) for name in names]

    if truncated:
        return ", ".join(names) + " et al."
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return names[0] + " and " + names[1]
    return ", ".join(names[:-1]) + ", and " + names[-1]


# --- Step 5: format one entry ------------------------------------------------

def _join(segments):
    text = " ".join(segment for segment in segments if segment).strip()
    return text.rstrip(",") + "." if text else ""


def format_entry(key, entry_type, fields, report):
    """Return {'html', 'author', 'title', 'venue', 'year'} for one entry."""
    if entry_type not in KNOWN_TYPES:
        report.warn(
            "'%s' is a @%s, which has no template -- formatted as an article"
            % (key, entry_type)
        )

    venue_field = VENUE_FIELD.get(entry_type, "journal")

    author = format_authors(fields.get("author", ""), key, report)
    title = esc(delatex(fields.get("title", ""), key, "title", report))
    year = esc(delatex(fields.get("year", ""), key, "year", report))
    venue = esc(delatex(fields.get(venue_field, ""), key, venue_field, report))

    if not venue and entry_type not in KNOWN_TYPES:
        for fallback in ("journal", "booktitle", "publisher", "school",
                         "institution", "organization", "howpublished"):
            if fields.get(fallback):
                venue = esc(delatex(fields[fallback], key, fallback, report))
                break

    for name, value in (("author", author), ("title", title), ("year", year),
                        (venue_field, venue)):
        if not value:
            report.warn("'%s' has no %s field" % (key, name))

    if entry_type == "book":
        markup = _join([
            author + "," if author else "",
            "<em>" + title + "</em>." if title else "",
            venue + "," if venue else "",
            year,
        ])
    elif entry_type == "inproceedings":
        markup = _join([
            author + "," if author else "",
            "\u201c" + title + ",\u201d" if title else "",
            "in <em>" + venue + "</em>," if venue else "",
            year,
        ])
    else:
        markup = _join([
            author + "," if author else "",
            "\u201c" + title + ",\u201d" if title else "",
            "<em>" + venue + "</em>," if venue else "",
            year,
        ])

    return {
        "html": markup,
        "author": author,
        "title": title,
        "venue": venue,
        "year": year,
    }


# --- Step 6: write the JavaScript --------------------------------------------

HEADER = """\
/* GENERATED FILE -- DO NOT EDIT BY HAND.

   Every change here is lost the next time the generator runs. To change a
   reference, edit the .bib file and regenerate:

       python %s

   Source .bib : %s
   Cited in    : %s
   Entries     : %d

   Loaded as a plain <script>, not fetched, so the deck still works when
   index.html is opened straight from disk. Pure ASCII for the same reason:
   accented characters are \\u escapes, so the file reads correctly whatever
   encoding the browser assumes. */

window.Bib = window.Bib || {};
window.Bib.entries = """


def write_js(entries, out_path, bib_path, html_path):
    payload = json.dumps(entries, ensure_ascii=True, indent=2, sort_keys=True)
    header = HEADER % (
        Path(__file__).resolve().relative_to(ROOT).as_posix(),
        bib_path.relative_to(ROOT).as_posix(),
        html_path.name,
        len(entries),
    )
    out_path.write_text(header + payload + ";\n", encoding="ascii")


# --- Main --------------------------------------------------------------------

def main():
    report = Report()

    # Printed in full, so there is never any doubt about which files a run
    # actually used.
    print("read   %s" % HTML_FILE)
    print("read   %s" % BIB_FILE)

    keys = find_cited_keys(HTML_FILE, report)
    database, abbreviations = parse_bib(BIB_FILE, report)

    entries = {}
    for key in keys:
        if key not in database:
            report.error("'%s' is cited in %s but is not in %s"
                         % (key, HTML_FILE.name, BIB_FILE.name))
            continue

        entry_type, fields, problems = database[key]
        for problem in problems:
            report.error("'%s' %s" % (key, problem))
        entries[key] = format_entry(key, entry_type, fields, report)

    for message in report.warnings:
        print("warning: " + message, file=sys.stderr)
    for message in report.errors:
        print("error:   " + message, file=sys.stderr)

    if report.errors:
        print("\nNothing was written. Fix the errors above and run again.",
              file=sys.stderr)
        return 1

    write_js(entries, OUT_FILE, BIB_FILE, HTML_FILE)

    print("wrote  %s" % OUT_FILE)
    summary = "%d citation keys, %d entries" % (len(keys), len(entries))
    if abbreviations:
        summary += ", %d abbreviations" % abbreviations
    print(summary)
    if report.warnings:
        print("%d warning(s) -- see above." % len(report.warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
