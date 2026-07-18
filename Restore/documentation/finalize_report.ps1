param(
    [Parameter(Mandatory = $true)]
    [string]$InputDocx,

    [Parameter(Mandatory = $true)]
    [string]$OutputPdf
)

$ErrorActionPreference = "Stop"
$wdExportFormatPDF = 17
$wdExportOptimizeForPrint = 0
$wdExportAllDocument = 0
$wdExportDocumentContent = 0
$wdExportCreateHeadingBookmarks = 1
$wdDoNotSaveChanges = 0

$docxPath = (Resolve-Path -LiteralPath $InputDocx).Path
$pdfPath = [System.IO.Path]::GetFullPath($OutputPdf)
$pdfDirectory = [System.IO.Path]::GetDirectoryName($pdfPath)
if (-not [System.IO.Directory]::Exists($pdfDirectory)) {
    [System.IO.Directory]::CreateDirectory($pdfDirectory) | Out-Null
}

$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $document = $word.Documents.Open($docxPath, $false, $false)

    # Sequence captions must be current before building the figure list.
    $null = $document.Fields.Update()
    foreach ($story in $document.StoryRanges) {
        $range = $story
        while ($null -ne $range) {
            if ($range.Fields.Count -gt 0) {
                $null = $range.Fields.Update()
            }
            $range = $range.NextStoryRange
        }
    }

    foreach ($toc in $document.TablesOfContents) {
        $null = $toc.Update()
    }
    foreach ($tof in $document.TablesOfFigures) {
        $null = $tof.Update()
    }

    $document.Repaginate()
    $null = $document.Fields.Update()
    foreach ($toc in $document.TablesOfContents) {
        $null = $toc.UpdatePageNumbers()
    }
    foreach ($tof in $document.TablesOfFigures) {
        $null = $tof.UpdatePageNumbers()
    }
    $document.Repaginate()

    $document.Save()
    $document.ExportAsFixedFormat(
        $pdfPath,
        $wdExportFormatPDF,
        $false,
        $wdExportOptimizeForPrint,
        $wdExportAllDocument,
        1,
        1,
        $wdExportDocumentContent,
        $true,
        $true,
        $wdExportCreateHeadingBookmarks,
        $true,
        $true,
        $false
    )

    [PSCustomObject]@{
        Docx = $docxPath
        Pdf = $pdfPath
        Pages = $document.ComputeStatistics(2)
        Fields = $document.Fields.Count
        TablesOfContents = $document.TablesOfContents.Count
        TablesOfFigures = $document.TablesOfFigures.Count
    } | ConvertTo-Json -Compress
}
finally {
    if ($null -ne $document) {
        $document.Close($wdDoNotSaveChanges)
        [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($document) | Out-Null
    }
    if ($null -ne $word) {
        $word.Quit()
        [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
