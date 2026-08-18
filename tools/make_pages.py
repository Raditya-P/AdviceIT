"""
AdviceIT by Radit, tools/make_pages.py
---------------------------------------------------------------
Regenerates the derived advisor page from index.html so the two pages
never drift apart. Run after editing index.html:

    python3 tools/make_pages.py

index.html          AI advisor (neural network)                       body data-advisor="ml"
interpretable.html  interpretable rule-based advisor (logistic         body data-advisor="logit"
                    regression on ILS-Bench)

Only four lines differ per page: the body attribute, the title, the meta
description and the og:title. Everything else is identical.
"""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")

PAGES = {
    "interpretable.html": {
        "advisor": "logit",
        "title": "AdviceIT by Radit: Interpretable Rule-based Advisor",
        "description": "The interpretable rule-based advisor page of AdviceIT by Radit: a scorecard derived from the expert-validated ILS-Bench dataset by multinomial logistic regression, transparent by design, with exact explanations.",
    },
}

INDEX_TITLE = "<title>AdviceIT by Radit: Explainable AI Investment Advice</title>"
INDEX_OG = '<meta property="og:title" content="AdviceIT by Radit: Explainable AI Investment Advice">'
INDEX_DESC_START = '<meta name="description" content="'


def main():
    src = open(SRC, encoding="utf-8").read()
    assert '<body data-advisor="ml">' in src and INDEX_TITLE in src and INDEX_OG in src
    # find the index description tag
    i = src.index(INDEX_DESC_START)
    j = src.index('">', i) + 2
    index_desc_tag = src[i:j]
    for name, cfg in PAGES.items():
        out = src.replace('<body data-advisor="ml">', '<body data-advisor="%s">' % cfg["advisor"])
        out = out.replace(INDEX_TITLE, "<title>%s</title>" % cfg["title"])
        out = out.replace(INDEX_OG, '<meta property="og:title" content="%s">' % cfg["title"])
        out = out.replace(index_desc_tag, '<meta name="description" content="%s">' % cfg["description"])
        out = out.replace("<!DOCTYPE html>\n<html lang=\"en\">",
                          "<!DOCTYPE html>\n<!-- %s is generated from index.html by tools/make_pages.py. Do not edit by hand, edit index.html and re-run the tool. -->\n<html lang=\"en\">" % name)
        with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
            f.write(out)
        print("wrote", name)


if __name__ == "__main__":
    main()
