from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
DOCX = ROOT / "output" / "Rapport_PFF_Gestion_Hoteliere_Diagrammes_Finalises.docx"
PDF = ROOT / "output" / "Rapport_PFF_Gestion_Hoteliere_Diagrammes_Finalises.pdf"
PREVIEWS = ROOT / "output" / "previews"

TECHNICAL_PLACEHOLDERS = (
    "À remplacer par le diagramme UML final",
    "À générer depuis les modèles Laravel définitifs",
    "À remplacer par un schéma lisible regroupé par domaine",
)
SCREENSHOT_PLACEHOLDER = "Capture de la version finale à insérer"


def docx_xml_text() -> str:
    with zipfile.ZipFile(DOCX) as archive:
        return archive.read("word/document.xml").decode("utf-8")


def create_contact_sheets(pdf: fitz.Document):
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    page_cards = []
    for index, page in enumerate(pdf):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.0, 1.0), alpha=False)
        page_path = PREVIEWS / f"page-{index + 1:02}.png"
        pixmap.save(page_path)
        image = Image.open(page_path).convert("RGB")
        image.thumbnail((360, 510))
        card = Image.new("RGB", (380, 540), "white")
        card.paste(image, ((380 - image.width) // 2, 10))
        ImageDraw.Draw(card).text((10, 518), f"Page {index + 1}", fill="black")
        page_cards.append(card)

    sheets = []
    per_sheet = 12
    columns = 4
    for offset in range(0, len(page_cards), per_sheet):
        cards = page_cards[offset : offset + per_sheet]
        rows = (len(cards) + columns - 1) // columns
        sheet = Image.new("RGB", (columns * 380, rows * 540), (225, 225, 225))
        for card_index, card in enumerate(cards):
            sheet.paste(card, ((card_index % columns) * 380, (card_index // columns) * 540))
        sheet_path = PREVIEWS / f"report-contact-sheet-{offset // per_sheet + 1}.png"
        sheet.save(sheet_path)
        sheets.append(str(sheet_path))
    return sheets


def main():
    if not DOCX.exists() or not PDF.exists():
        raise FileNotFoundError("Final DOCX/PDF not found")

    xml = docx_xml_text()
    pdf = fitz.open(PDF)
    page_texts = [page.get_text() for page in pdf]
    body_text = "\n".join(page_texts[6:])

    technical_placeholder_counts = {
        marker: xml.count(marker) for marker in TECHNICAL_PLACEHOLDERS
    }
    screenshot_placeholder_count = xml.count(SCREENSHOT_PLACEHOLDER)
    seq_figure_count = xml.count("SEQ Figure")

    body_caption_numbers = [
        int(number)
        for number in re.findall(r"Figure\s+(\d+)\s+—", body_text)
    ]
    caption_issues = {
        number: body_caption_numbers.count(number)
        for number in range(1, 39)
        if body_caption_numbers.count(number) != 1
    }

    toc_start = next(
        index for index, text in enumerate(page_texts) if "Table des matières" in text
    )
    figure_list_start = next(
        index
        for index, text in enumerate(page_texts)
        if "Liste des figures" in text and "Table des matières" not in text and index < 7
    )
    introduction_start = next(
        index for index, text in enumerate(page_texts) if "Introduction générale" in text and index > figure_list_start
    )
    toc_page_indexes = list(range(toc_start, figure_list_start))
    figure_page_indexes = list(range(figure_list_start, introduction_start))
    toc_pages = [index + 1 for index in toc_page_indexes]
    figure_list_pages = [index + 1 for index in figure_page_indexes]
    toc_links = [link for index in toc_page_indexes for link in pdf[index].get_links()]
    figure_links = [link for index in figure_page_indexes for link in pdf[index].get_links()]

    valid_toc_links = [link for link in toc_links if link.get("page", -1) >= 0]
    valid_figure_links = [link for link in figure_links if link.get("page", -1) >= 0]

    footer_numbers = []
    for text in page_texts[1:]:
        matches = re.findall(r"Page\s+(\d+)", text)
        footer_numbers.append(int(matches[0]) if matches else None)

    landscape_pages = [
        index + 1
        for index, page in enumerate(pdf)
        if page.rect.width > page.rect.height
    ]
    sparse_pages = [
        index + 1
        for index, text in enumerate(page_texts)
        if len(" ".join(text.split())) < 80
    ]

    result = {
        "docx_bytes": DOCX.stat().st_size,
        "pdf_bytes": PDF.stat().st_size,
        "pdf_pages": pdf.page_count,
        "seq_figure_fields": seq_figure_count,
        "technical_placeholder_counts": technical_placeholder_counts,
        "screenshot_placeholders": screenshot_placeholder_count,
        "body_caption_issues": caption_issues,
        "toc_pages": toc_pages,
        "toc_links": len(toc_links),
        "toc_valid_internal_links": len(valid_toc_links),
        "figure_list_pages": figure_list_pages,
        "figure_list_links": len(figure_links),
        "figure_list_valid_internal_links": len(valid_figure_links),
        "footer_numbering_expected": footer_numbers == list(range(1, pdf.page_count)),
        "footer_numbers": footer_numbers,
        "landscape_pages": landscape_pages,
        "sparse_pages": sparse_pages,
        "contact_sheets": create_contact_sheets(pdf),
    }

    failures = []
    if any(technical_placeholder_counts.values()):
        failures.append("Technical placeholders remain")
    if screenshot_placeholder_count != 29:
        failures.append(f"Expected 29 screenshot placeholders, found {screenshot_placeholder_count}")
    if seq_figure_count != 38:
        failures.append(f"Expected 38 SEQ Figure fields, found {seq_figure_count}")
    if caption_issues:
        failures.append(f"Caption numbering issues: {caption_issues}")
    if len(valid_toc_links) != len(toc_links) or not toc_links:
        failures.append("TOC contains missing or invalid links")
    if len(valid_figure_links) != 38:
        failures.append(f"Expected 38 valid figure-list links, found {len(valid_figure_links)}")
    if not result["footer_numbering_expected"]:
        failures.append("Footer page numbering is not continuous after the cover")

    result["failures"] = failures
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
