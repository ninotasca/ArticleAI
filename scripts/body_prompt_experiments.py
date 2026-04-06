#!/usr/bin/env python3
from __future__ import annotations

import json
import textwrap
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

API_BASE = "http://localhost:3001/api"
OUT_DIR = Path("/Users/ntagent/dev/northstar/articleai/experiments/body-prompts")
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


def build_prompt(persona_text: str, body_instructions: str) -> str:
    return "\n\n".join(
        [
            INTRO,
            f'"""\n{persona_text.strip()}\n"""',
            f"Body Instructions:\n{body_instructions.strip()}",
            "Article to evaluate:\nTitle: {{title}}\nDeck: {{deck}}\nBody: {{body}}",
        ]
    )


VARIANTS = [
    PromptVariant(
        slug="body-minimal-threshold",
        label="Body / Minimal Threshold",
        mode="conservative",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for a busy, experienced B2B travel editor.

            Be conservative. Do not nitpick. Only call out issues if they are meaningful and clearly worth an editor's attention.
            Focus first on:
            - factual or conceptual confusion
            - obvious brand-voice drift
            - passages that are vague, repetitive, or structurally confusing
            - clear copy issues such as misspellings or wording that weakens credibility

            If there are no meaningful issues, reply exactly:
            No Notes - Body works well

            Otherwise return this exact plain-text structure:
            Verdict: worth reviewing
            Main Issue: <one short sentence>
            Guidance: <1-2 concise sentences>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-brand-voice-first",
        label="Body / Brand Voice First",
        mode="brand-voice",
        instructions=textwrap.dedent(
            """
            Evaluate the article body primarily for alignment with the selected brand voice.

            Treat the editor like a professional. Do not give broad writing advice. Only point out meaningful mismatches between the body and the brand voice, especially where tone, clarity, authority, or audience fit break down.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth reviewing>
            Brand Voice Note: <one short sentence>
            Editorial Guidance: <1-2 concise sentences, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-gross-misunderstanding-only",
        label="Body / Gross Misunderstanding Only",
        mode="threshold",
        instructions=textwrap.dedent(
            """
            Evaluate the article body only for serious issues.

            Do not comment on style preferences, minor phrasing choices, or things an editor could debate. Only speak up for major clarity problems, obvious misunderstandings, strong brand-voice mismatch, or copy errors that noticeably reduce quality.

            If no major issue is present, reply exactly:
            No major concerns

            Otherwise return this exact plain-text structure:
            Major Concern: <one short sentence>
            Why It Matters: <1-2 concise sentences>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-professional-nod",
        label="Body / Professional Nod",
        mode="verdict",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for a busy, experienced B2B travel editor.

            Start with a practical editorial nod: is the piece fundamentally fine, or is it worth another pass? Be respectful and restrained.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth another pass>
            Reason: <one short sentence>
            Guidance: <1-2 concise sentences, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-clarity-and-flow",
        label="Body / Clarity and Flow",
        mode="clarity",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for clarity, flow, and editorial usefulness to a B2B travel audience.

            Keep your standards high, but only comment on issues that materially affect readability, understanding, or credibility.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth reviewing>
            Clarity Note: <one short sentence>
            Flow Note: <one short sentence, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-copy-desk-light",
        label="Body / Copy Desk Light",
        mode="copy-desk",
        instructions=textwrap.dedent(
            """
            Review the article body lightly, as a senior editor doing a quick copy-and-clarity pass.

            Focus on obvious wording problems, repetition, misspellings, confusing transitions, and anything that weakens authority or polish. Do not rewrite the piece. Do not give a laundry list.

            Return your response in this exact plain-text structure:
            Verdict: <clean / worth tightening>
            Primary Note: <one short sentence>
            Secondary Note: <one short sentence, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-reader-trust",
        label="Body / Reader Trust",
        mode="trust",
        instructions=textwrap.dedent(
            """
            Evaluate the article body with reader trust in mind.

            Check whether the writing sounds credible, professional, informed, and appropriately confident for a B2B travel audience. Only call out issues that would meaningfully reduce reader trust or brand confidence.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth reviewing>
            Trust Note: <one short sentence>
            Guidance: <1-2 concise sentences, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-sparse-brand-check",
        label="Body / Sparse Brand Check",
        mode="sparse",
        instructions=textwrap.dedent(
            """
            Evaluate the article body against the brand voice.

            Be extremely concise. Assume the editor is experienced and busy. Only note the biggest issue, if any.

            Return your response in this exact plain-text structure:
            Verdict: <keep / review>
            Note: <one short sentence>
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-severity-bands",
        label="Body / Severity Bands",
        mode="severity",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for meaningful editorial issues.

            Classify your response conservatively. Use severity only when justified.

            Return your response in this exact plain-text structure:
            Severity: <none / light / moderate>
            Main Note: <one short sentence>
            Guidance: <1-2 concise sentences, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-structure-focus",
        label="Body / Structure Focus",
        mode="structure",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for structural coherence.

            Look for confusing ordering, weak transitions, missing context, or repetition that makes the piece harder to follow. Be conservative and only comment on meaningful issues.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth reviewing>
            Structure Note: <one short sentence>
            Guidance: <1-2 concise sentences, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-voice-and-precision",
        label="Body / Voice and Precision",
        mode="voice-precision",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for brand-voice alignment and editorial precision.

            Focus on whether the piece sounds authoritative, relevant, and appropriately polished for an informed B2B travel reader. Only comment where the issue is clearly worth the editor's time.

            Return your response in this exact plain-text structure:
            Verdict: <good to go / worth reviewing>
            Voice Note: <one short sentence>
            Precision Note: <one short sentence, or write "None">
            """
        ).strip(),
    ),
    PromptVariant(
        slug="body-no-suggestions-unless-needed",
        label="Body / No Suggestions Unless Needed",
        mode="threshold",
        instructions=textwrap.dedent(
            """
            Evaluate the article body for a busy, experienced editor.

            If the piece is fundamentally solid, do not offer improvements just to be useful.

            If there is no meaningful issue, reply exactly:
            No Notes - Body works well

            Otherwise return this exact plain-text structure:
            Verdict: worth reviewing
            Reason: <one short sentence>
            Guidance: <1-2 concise sentences>
            """
        ).strip(),
    ),
]


def main() -> None:
    personas = get_json('/personas')['personas']
    articles = get_json('/articles/sample?count=6')['articles']
    if not personas:
        raise SystemExit('No personas found')
    persona = personas[0]

    report: dict[str, Any] = {
        'persona': {'id': persona['id'], 'title': persona['title']},
        'articleCount': len(articles),
        'variants': [],
    }

    for variant in VARIANTS:
        full_prompt = build_prompt(persona['persona'], variant.instructions)
        rows = []
        for article in articles:
            result = post_json('/ai-test', {'prompt': full_prompt, 'articleId': article['id']})
            rows.append(
                {
                    'articleId': article['id'],
                    'originalTitle': article['title'],
                    'deck': article.get('deck', ''),
                    'analysis': result['result'],
                }
            )
        report['variants'].append(
            {
                'slug': variant.slug,
                'label': variant.label,
                'mode': variant.mode,
                'instructions': variant.instructions,
                'results': rows,
            }
        )

    json_path = OUT_DIR / 'latest.json'
    md_path = OUT_DIR / 'latest.md'
    frontend_json_path = Path('/Users/ntagent/dev/northstar/articleai/frontend/src/bodyPromptLabData.json')
    serialized = json.dumps(report, indent=2)
    json_path.write_text(serialized)
    frontend_json_path.write_text(serialized)

    lines = [
        '# Body Prompt Experiments',
        '',
        f"Persona: **{persona['title']}**",
        '',
        f"Articles tested: **{len(articles)}**",
        '',
    ]

    for variant in report['variants']:
        lines.extend([
            f"## {variant['label']}",
            '',
            '### Prompt',
            '',
            '```text',
            variant['instructions'],
            '```',
            '',
        ])
        for row in variant['results']:
            lines.extend([
                f"### Article {row['articleId']}",
                '',
                f"**Original Title:** {row['originalTitle']}",
                '',
                f"**Deck:** {row['deck']}",
                '',
                '**Analysis:**',
                '',
                row['analysis'],
                '',
            ])
    md_path.write_text('\n'.join(lines))
    print(f'Wrote {json_path}')
    print(f'Wrote {md_path}')
    print(f'Wrote {frontend_json_path}')


if __name__ == '__main__':
    main()
