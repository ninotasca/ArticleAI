#!/usr/bin/env python3
from __future__ import annotations

import json
import textwrap
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

API_BASE = "http://localhost:3001/api"
OUT_DIR = Path("/Users/ntagent/dev/northstar/articleai/experiments/title-prompts")
OUT_DIR.mkdir(parents=True, exist_ok=True)

INTRO = (
    "Evaluate and improve the provided article content. Write in a professional, "
    "confident, and clear tone. Do not include numeric ratings or technical details. "
    "Use the following brand voice definition as your tone and style guide:"
)


@dataclass
class PromptVariant:
    slug: str
    label: str
    mode: str
    instructions: str


def get_json(path: str) -> Any:
    with urllib.request.urlopen(API_BASE + path, timeout=60) as r:
        return json.load(r)


def post_json(path: str, payload: dict[str, Any]) -> Any:
    req = urllib.request.Request(
        API_BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def build_prompt(persona_text: str, title_instructions: str) -> str:
    return "\n\n".join(
        [
            INTRO,
            f'"""\n{persona_text.strip()}\n"""',
            f"Title Instructions:\n{title_instructions.strip()}",
            "Article to evaluate:\nTitle: {{title}}\nDeck: {{deck}}\nBody: {{body}}",
        ]
    )


VARIANTS = [
    PromptVariant(
        slug="conservative-brief",
        label="Conservative / Brief",
        mode="conservative",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Judge whether the title is accurate, clear, specific, SEO-aware, and aligned with the article, deck, and brand voice. Prefer small editorial improvements over dramatic rewrites.

            Focus on:
            - clarity of the main subject
            - specificity of the angle
            - use of relevant industry/search terms
            - alignment with the actual article
            - credibility for an experienced travel-industry reader

            Return your response in this exact plain-text structure:
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title>
            Alternate Title: <optional second conservative alternative, or write "None"> 
            """
        ).strip(),
    ),
    PromptVariant(
        slug="conservative-no-notes",
        label="Conservative / No Notes If Fine",
        mode="conservative",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            If the title is already strong, accurate, specific, SEO-aware, and aligned with the article and brand voice, reply exactly:
            No Notes - Works great

            Only give feedback if there is a real editorial opportunity to improve the title.
            When you do give feedback, keep it brief and conservative.

            Return either:
            No Notes - Works great

            or this exact structure:
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="conservative-single-score",
        label="Conservative / Single Score",
        mode="scored",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Score the title overall based on clarity, specificity, search relevance, credibility, and fit with the article.
            Be tough but fair. Prefer conservative edits over dramatic rewrites.

            Return your response in this exact plain-text structure:
            Score: <0-100>
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title, or repeat the original if no change is needed>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="conservative-multi-score",
        label="Conservative / Multi Score",
        mode="scored",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Score the title in these dimensions: SEO, Clarity, Specificity, Voice Fit.
            Be concise. Prefer precise editorial edits over flashy rewrites.

            Return your response in this exact plain-text structure:
            SEO: <0-10>
            Clarity: <0-10>
            Specificity: <0-10>
            Voice Fit: <0-10>
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="sparse-editorial",
        label="Sparse / Editorial",
        mode="sparse",
        instructions=textwrap.dedent(
            """
            Evaluate the article title like a seasoned B2B travel editor reviewing a colleague's work.

            Do not over-explain. Do not patronize. Do not give writing-class advice.
            Only call out the most important issue, if any.

            Return your response in this exact plain-text structure:
            Verdict: <keep / revise>
            Note: <one short sentence>
            Suggested Title: <one title, or write "Keep current title">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="seo-first",
        label="SEO First",
        mode="seo",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience with strong emphasis on search usefulness.

            Prioritize:
            - recognizable industry terms
            - topical specificity
            - clarity about the subject matter
            - alignment with the actual article

            Do not force keyword stuffing. Do not become clickbait.

            Return your response in this exact plain-text structure:
            Assessment: <1-2 concise sentences focused on search relevance and editorial clarity>
            Suggested Title: <one SEO-strong title>
            Alternate Title: <optional second SEO-strong title, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="risky-punchier",
        label="Risky / Punchier",
        mode="risky",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            You may take a stronger editorial swing if the current title undersells the article, but keep it credible and trade-appropriate. Aim for sharper angles and stronger framing without becoming cheesy or consumer-clickbait.

            Return your response in this exact plain-text structure:
            Assessment: <1-2 concise sentences>
            Suggested Title: <one stronger title>
            Alternate Title: <one meaningfully different stronger title>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="strict-no-change-threshold",
        label="Strict / Only If Needed",
        mode="threshold",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Only suggest a revision if the current title has a meaningful problem with clarity, specificity, SEO relevance, or alignment with the article. If the title is already solid, do not nitpick.

            If no meaningful change is needed, reply exactly:
            No Notes - Works great

            Otherwise return this exact plain-text structure:
            Problem: <one short sentence>
            Suggested Title: <one improved title>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="deck-aware",
        label="Deck-Aware",
        mode="deck-aware",
        instructions=textwrap.dedent(
            """
            Evaluate the article title in relation to both the deck and body for a B2B travel industry audience.

            Check whether the title and deck work together efficiently, without redundancy, vagueness, or missed opportunities to surface the article's real angle.

            Return your response in this exact plain-text structure:
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title>
            Deck Interaction: <one short sentence about how the title and deck work together>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="journalist-benchmark",
        label="Seasoned Journalist Benchmark",
        mode="journalist",
        instructions=textwrap.dedent(
            """
            Evaluate the article title as a seasoned trade journalist helping another experienced editor.

            Be direct, restrained, and useful. Assume the editor is competent and busy. Avoid filler, classroom language, and hand-holding. Judge the title on accuracy, sharpness, specificity, and editorial usefulness.

            Return your response in this exact plain-text structure:
            Assessment: <1-2 concise sentences>
            Suggested Title: <one improved title, or write "Keep current title">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="editor-nod-keep-or-revise",
        label="Editor Nod / Keep or Revise",
        mode="verdict",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a busy, experienced B2B travel editor.

            Start by deciding whether the title is already solid enough to keep or whether it is worth considering a revision. Be selective. Do not invent problems just to be helpful.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth revising>
            Reason: <one short sentence explaining the verdict>
            Suggested Title: <one improved title, or write "Keep current title">
            Alternate Title: <optional alternate if useful, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="editor-nod-seo-alt",
        label="Editor Nod + SEO Alt",
        mode="verdict-seo",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a busy, experienced B2B travel editor.

            First decide whether the current title is good to go or worth revising. Then, if a revision is worth considering, provide one improved editorial title and one SEO-friendlier alternative. Keep both credible and trade-appropriate.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth revising>
            Reason: <one short sentence>
            Editorial Title: <best editorial title, or write "Keep current title">
            SEO Title: <more search-friendly title, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="headline-options-by-trait",
        label="Headline Options by Trait",
        mode="alternatives",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Give a quick verdict on whether the current title is fine or worth revising. If revision is worth considering, provide alternatives with distinct traits so an experienced editor can choose quickly.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth revising>
            Reason: <one short sentence>
            Conservative Title: <one restrained improvement, or write "Keep current title">
            SEO Title: <one more search-friendly version, or write "None">
            Buzzy Title: <one slightly livelier but still credible version, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="minimal-verdict-threshold",
        label="Minimal Verdict Threshold",
        mode="threshold",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a busy, experienced B2B travel editor.

            If the title is strong enough to publish as-is, reply exactly:
            Good to go

            Only if there is a meaningful editorial reason to revisit it, return this exact plain-text structure:
            Verdict: worth revising
            Reason: <one short sentence>
            Suggested Title: <one improved title>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="single-score-with-verdict",
        label="Single Score + Verdict",
        mode="scored-verdict",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Give a single overall score and a practical editorial verdict. Be direct and concise.

            Return your response in this exact plain-text structure:
            Score: <0-100>
            Verdict: <good to go / worth revising>
            Reason: <one short sentence>
            Suggested Title: <one improved title, or write "Keep current title">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="multi-score-with-options",
        label="Multi Score + Options",
        mode="scored-options",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a B2B travel industry audience.

            Score the title for SEO, Clarity, Specificity, and Brand Fit. Then give a practical editorial verdict and headline options only if useful.

            Return your response in this exact plain-text structure:
            SEO: <0-10>
            Clarity: <0-10>
            Specificity: <0-10>
            Brand Fit: <0-10>
            Verdict: <good to go / worth revising>
            Reason: <one short sentence>
            Conservative Title: <one restrained improvement, or write "Keep current title">
            SEO Title: <one search-friendly alternative, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="why-revise-only",
        label="Why Revise Only",
        mode="reason-first",
        instructions=textwrap.dedent(
            """
            Evaluate the article title for a busy, experienced B2B travel editor.

            Your job is to quickly answer two questions: is this worth revisiting, and if so, why?

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth revising>
            Why: <one short sentence>
            Better Title: <one improved title, or write "Keep current title">
            """
        ).strip(),
    ),
]


def main() -> None:
    personas = get_json("/personas")["personas"]
    articles = get_json("/articles/sample?count=6")["articles"]
    if not personas:
        raise SystemExit("No personas found")
    persona = personas[0]

    report: dict[str, Any] = {
        "persona": {"id": persona["id"], "title": persona["title"]},
        "articleCount": len(articles),
        "variants": [],
    }

    for variant in VARIANTS:
        full_prompt = build_prompt(persona["persona"], variant.instructions)
        rows = []
        for article in articles:
            result = post_json(
                "/ai-test",
                {"prompt": full_prompt, "articleId": article["id"]},
            )
            rows.append(
                {
                    "articleId": article["id"],
                    "originalTitle": article["title"],
                    "deck": article.get("deck", ""),
                    "analysis": result["result"],
                }
            )
        report["variants"].append(
            {
                "slug": variant.slug,
                "label": variant.label,
                "mode": variant.mode,
                "instructions": variant.instructions,
                "results": rows,
            }
        )

    json_path = OUT_DIR / "latest.json"
    md_path = OUT_DIR / "latest.md"
    frontend_json_path = Path("/Users/ntagent/dev/northstar/articleai/frontend/src/titlePromptLabData.json")
    serialized = json.dumps(report, indent=2)
    json_path.write_text(serialized)
    frontend_json_path.write_text(serialized)

    lines = [
        "# Title Prompt Experiments",
        "",
        f"Persona: **{persona['title']}**",
        "",
        f"Articles tested: **{len(articles)}**",
        "",
    ]

    for variant in report["variants"]:
        lines.extend([
            f"## {variant['label']}",
            "",
            "### Prompt",
            "",
            "```text",
            variant["instructions"],
            "```",
            "",
        ])
        for row in variant["results"]:
            lines.extend([
                f"### Article {row['articleId']}",
                "",
                f"**Original Title:** {row['originalTitle']}",
                "",
                f"**Deck:** {row['deck']}",
                "",
                "**Analysis:**",
                "",
                row["analysis"],
                "",
            ])
    md_path.write_text("\n".join(lines))
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    print(f"Wrote {frontend_json_path}")


if __name__ == "__main__":
    main()
