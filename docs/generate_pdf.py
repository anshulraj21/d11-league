"""Generate D11 League Functional Guide PDF using reportlab."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)

# Colors matching the app theme
PRIMARY = HexColor('#6366f1')
ACCENT = HexColor('#f59e0b')
SUCCESS = HexColor('#10b981')
DANGER = HexColor('#ef4444')
SURFACE = HexColor('#1e1e2e')
TEXT_MUTED = HexColor('#94a3b8')
DARK_BG = HexColor('#2a2a3e')

def build_pdf():
    doc = SimpleDocTemplate(
        "C:/Users/anshu/FantasyLeague/docs/D11_League_Functional_Guide.pdf",
        pagesize=A4,
        rightMargin=50, leftMargin=50,
        topMargin=50, bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle('AppTitle', parent=styles['Title'],
        fontSize=28, textColor=PRIMARY, spaceAfter=6, alignment=TA_CENTER))
    styles.add(ParagraphStyle('AppSubtitle', parent=styles['Normal'],
        fontSize=12, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=20))
    styles.add(ParagraphStyle('SectionTitle', parent=styles['Heading1'],
        fontSize=18, textColor=PRIMARY, spaceBefore=20, spaceAfter=10,
        borderWidth=0, borderPadding=0))
    styles.add(ParagraphStyle('SubSection', parent=styles['Heading2'],
        fontSize=14, textColor=HexColor('#818cf8'), spaceBefore=12, spaceAfter=6))
    styles.add(ParagraphStyle('Body', parent=styles['Normal'],
        fontSize=10, leading=14, spaceAfter=8))
    styles.add(ParagraphStyle('BulletItem', parent=styles['Normal'],
        fontSize=10, leading=14, leftIndent=20, bulletIndent=10, spaceAfter=4))
    styles.add(ParagraphStyle('HighlightBox', parent=styles['Normal'],
        fontSize=10, leading=14, backColor=HexColor('#f0f0ff'), borderColor=PRIMARY,
        borderWidth=1, borderPadding=8, spaceAfter=10))
    styles.add(ParagraphStyle('StatusOpen', parent=styles['Normal'],
        fontSize=9, textColor=PRIMARY, alignment=TA_CENTER))
    styles.add(ParagraphStyle('StatusLive', parent=styles['Normal'],
        fontSize=9, textColor=DANGER, alignment=TA_CENTER))
    styles.add(ParagraphStyle('Footer', parent=styles['Normal'],
        fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER))
    styles.add(ParagraphStyle('URLStyle', parent=styles['Normal'],
        fontSize=10, textColor=PRIMARY))
    styles.add(ParagraphStyle('CenterBody', parent=styles['Normal'],
        fontSize=10, leading=14, alignment=TA_CENTER, spaceAfter=8))
    styles.add(ParagraphStyle('NumberStep', parent=styles['Normal'],
        fontSize=10, leading=14, leftIndent=25, bulletIndent=10, spaceAfter=4))

    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 100))
    story.append(Paragraph("D11 League", styles['AppTitle']))
    story.append(Paragraph("Dream11 IPL Private League Money Manager", styles['AppSubtitle']))
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="60%", thickness=2, color=PRIMARY, spaceAfter=20))
    story.append(Paragraph("Functional Guide", styles['CenterBody']))
    story.append(Paragraph("Version 1.2 | April 2026", styles['CenterBody']))
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        '<link href="https://d11-league.vercel.app" color="#6366f1">https://d11-league.vercel.app</link>',
        styles['CenterBody']))
    story.append(Paragraph(
        '<link href="https://github.com/anshulraj21/d11-league" color="#6366f1">github.com/anshulraj21/d11-league</link>',
        styles['CenterBody']))
    story.append(Spacer(1, 60))

    # Key highlights box
    highlights = [
        ["Auto-loads full IPL 2026 schedule (70 matches)"],
        ["Screenshot OCR to extract Dream11 results automatically"],
        ["Smart settlement with UPI deep links for one-tap payment"],
        ["Live match integration via CricAPI"],
        ["Transparent audit trail for all result changes"],
        ["100% free - no paid services required"],
    ]
    ht = Table(highlights, colWidths=[350])
    ht.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8f7ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#374151')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 30),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(ht)
    story.append(PageBreak())

    # ==================== TABLE OF CONTENTS ====================
    story.append(Paragraph("Table of Contents", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=15))
    toc_items = [
        "1. Overview",
        "2. Getting Started (Registration & Login)",
        "3. League Management",
        "4. Match Flow (Before, During, After)",
        "5. Results Entry (OCR & Manual)",
        "6. Settlement & Payment",
        "7. Match Status Lifecycle",
        "8. Key Features Summary",
        "9. Tech Stack",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['Body']))
    story.append(PageBreak())

    # ==================== 1. OVERVIEW ====================
    story.append(Paragraph("1. Overview", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))
    story.append(Paragraph(
        "D11 League is a companion web app for managing money in Dream11 IPL private leagues. "
        "It automates the tedious process of tracking entry fees, calculating prizes, and settling "
        "payments among a group of 10+ friends playing Dream11 fantasy cricket together.", styles['Body']))
    story.append(Paragraph("<b>Problem it solves:</b> After every IPL match, someone in your group has to "
        "manually calculate who won how much, who owes whom, and chase payments via WhatsApp. "
        "D11 League does all of this automatically.", styles['Body']))
    story.append(Paragraph("<b>How it works:</b>", styles['Body']))
    for step in [
        "1. Friends register with their Dream11 team names and UPI IDs",
        "2. One person creates a league and shares the invite code",
        "3. Load the full IPL 2026 schedule with one click (70 matches)",
        "4. Before each match, players join the match entry",
        "5. After the match, someone uploads the Dream11 screenshot or enters results manually",
        "6. The app calculates prizes, determines who owes whom, and generates UPI payment links",
        "7. Players settle up via UPI and mark payments as complete",
    ]:
        story.append(Paragraph(step, styles['NumberStep']))
    story.append(PageBreak())

    # ==================== 2. GETTING STARTED ====================
    story.append(Paragraph("2. Getting Started", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("Registration", styles['SubSection']))
    story.append(Paragraph("Navigate to the app and click <b>Register</b>. Fill in:", styles['Body']))
    reg_data = [
        ['Field', 'Description', 'Required'],
        ['Your Name', 'Display name shown to other members', 'Yes'],
        ['Dream11 Team Name', 'Your team name on Dream11 (used for OCR matching)', 'Yes'],
        ['Email', 'Used for login', 'Yes'],
        ['Password', 'Minimum 6 characters', 'Yes'],
        ['UPI ID', 'e.g. name@okaxis (for receiving payments)', 'Optional'],
    ]
    rt = Table(reg_data, colWidths=[120, 250, 60])
    rt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#fafafa')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(rt)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Dashboard", styles['SubSection']))
    story.append(Paragraph(
        "After login, the Dashboard shows all leagues you belong to. From here you can:", styles['Body']))
    for item in ["<b>Create League</b> - start a new league with default settings",
                 "<b>Join League</b> - enter a 6-character invite code from a friend"]:
        story.append(Paragraph(item, styles['BulletItem']))
    story.append(PageBreak())

    # ==================== 3. LEAGUE MANAGEMENT ====================
    story.append(Paragraph("3. League Management", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("Creating a League", styles['SubSection']))
    story.append(Paragraph("When creating a league, you set:", styles['Body']))
    for item in [
        "<b>League Name</b> - e.g. 'Bros IPL 2026'",
        "<b>Default Entry Fee</b> - applied to auto-created matches (default: Rs.30)",
        "<b>Default Max Players</b> - how many can join each match (default: 10)",
        "<b>Default Winners</b> - number of prize positions (default: 3)",
    ]:
        story.append(Paragraph(item, styles['BulletItem']))
    story.append(Paragraph(
        "A <b>6-character invite code</b> is auto-generated (e.g. PUHDJ7). Share this with friends to join.",
        styles['Body']))

    story.append(Paragraph("Loading IPL Schedule", styles['SubSection']))
    story.append(Paragraph(
        "Click <b>Load IPL Schedule</b> on the league page to instantly create all 70 IPL 2026 "
        "league-stage matches with your default settings. This is safe to click multiple times - "
        "existing matches are skipped. Matches are sorted chronologically and grouped by date.",
        styles['Body']))

    story.append(Paragraph("League Detail Page", styles['SubSection']))
    story.append(Paragraph("The league page has three tabs:", styles['Body']))
    tabs_data = [
        ['Tab', 'Content'],
        ['Matches', 'All matches sorted by date, grouped with headers (e.g. "Sat, 28 Mar"). '
         'Today\'s matches highlighted with amber border and TODAY badge.'],
        ['Members', 'All league members with display name, Dream11 team name, and UPI ID.'],
        ['Standings', 'Season-wide earnings leaderboard: rank, name, matches played, net earnings '
         '(green if positive, red if negative).'],
    ]
    tt = Table(tabs_data, colWidths=[70, 360])
    tt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(tt)
    story.append(PageBreak())

    # ==================== 4. MATCH FLOW ====================
    story.append(Paragraph("4. Match Flow", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("Before the Match", styles['SubSection']))
    for item in [
        "Matches are auto-created from the IPL schedule with league defaults",
        "Players click <b>Join Match</b> (max player limit enforced atomically via Firestore transaction)",
        "Entry fee, max players, and number of winners are editable on open matches via <b>Edit match settings</b>",
        "Winner presets: 1 winner (100%), 2 (70/30), 3 (60/25/15), 4 (50/25/15/10)",
    ]:
        story.append(Paragraph(item, styles['BulletItem']))

    story.append(Paragraph("During the Match (Live Integration)", styles['SubSection']))
    for item in [
        "<b>CricAPI</b> auto-checks today's matches when the league page loads",
        "Live matches show a red <b>LIVE</b> badge on match cards",
        "Match detail page shows a live score banner (runs/wickets/overs)",
        "Polls every 3 minutes on league page, every 2 minutes on match detail",
        "Only fires for today's open matches to conserve the 100 free API calls/day",
    ]:
        story.append(Paragraph(item, styles['BulletItem']))

    story.append(Paragraph("After the Match", styles['SubSection']))
    for item in [
        "CricAPI detects match end and auto-marks the match as <b>completed</b>",
        "Past-dated matches without results auto-show as <b>closed</b>",
        "Results entry buttons only appear AFTER the match ends",
        "Joined users on open matches see: 'Results can be added after the match ends'",
    ]:
        story.append(Paragraph(item, styles['BulletItem']))
    story.append(PageBreak())

    # ==================== 5. RESULTS ENTRY ====================
    story.append(Paragraph("5. Results Entry", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("Option A: Screenshot + OCR", styles['SubSection']))
    for i, step in enumerate([
        "Click <b>Upload Screenshot + OCR</b> on the match detail page",
        "Select a Dream11 leaderboard screenshot (PNG/JPG)",
        "Click <b>Extract Results (OCR)</b> - Tesseract.js processes the image in-browser",
        "The parser extracts team names and points using regex patterns",
        "Fuzzy matching (Levenshtein distance) maps OCR team names to registered members",
        "Results shown with confidence badges: <font color='#10b981'>exact</font> / <font color='#6366f1'>high</font> / <font color='#f59e0b'>low</font>",
        "Review and click <b>Confirm Results</b>, or switch to manual editing",
    ], 1):
        story.append(Paragraph(f"{i}. {step}", styles['NumberStep']))

    story.append(Paragraph("Option B: Manual Entry", styles['SubSection']))
    for i, step in enumerate([
        "Click <b>Add Results Manually</b> on the match detail page",
        "A modal lists all joined players with points input fields",
        "Enter Dream11 points for each player (supports decimals like 580.5)",
        "Click <b>Save Results</b> - auto-ranks by descending points",
    ], 1):
        story.append(Paragraph(f"{i}. {step}", styles['NumberStep']))

    story.append(Paragraph("Audit History", styles['SubSection']))
    story.append(Paragraph(
        "Every result change is logged with: <b>who</b> made the change, <b>when</b>, and <b>what</b> changed. "
        "The match detail page shows a collapsible <b>Change History</b> section with diffs "
        "(player: old points -> new points). This ensures transparency in your group.",
        styles['Body']))
    story.append(PageBreak())

    # ==================== 6. SETTLEMENT ====================
    story.append(Paragraph("6. Settlement & Payment", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("How Settlement Works", styles['SubSection']))
    for item in [
        "<b>Pool</b> = Entry Fee x Number of Joined Players (e.g. Rs.100 x 10 = Rs.1000)",
        "Prizes calculated from configurable percentages (e.g. 60/25/15 for top 3)",
        "<b>Net balance</b> per player = Prize Won - Entry Fee",
        "<b>Greedy algorithm</b> minimizes the number of payment transactions",
        "Click <b>Generate Settlements</b> to compute who owes whom",
    ]:
        story.append(Paragraph(item, styles['BulletItem']))

    story.append(Paragraph("Role-Based Payment Actions", styles['SubSection']))
    actions_data = [
        ['User Role', 'What They See', 'Action'],
        ['Payer (owes money)', '"Pay via UPI" (mobile) or "Copy UPI ID" (desktop)', 'Initiate payment'],
        ['Receiver (owed money)', '"Mark Paid" button', 'Confirm receipt'],
        ['Other users', 'Settlement info (who, amount, status)', 'View only'],
    ]
    at = Table(actions_data, colWidths=[110, 200, 120])
    at.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(at)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Important:</b> Match status only becomes 'settled' when ALL payments are marked as paid. "
        "Until then, it stays as 'completed'.", styles['Body']))
    story.append(PageBreak())

    # ==================== 7. MATCH STATUS LIFECYCLE ====================
    story.append(Paragraph("7. Match Status Lifecycle", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    status_data = [
        ['Status', 'Badge Color', 'Meaning', 'Triggered By'],
        ['open', 'Blue', 'Match accepting joins, not started yet', 'Match created'],
        ['LIVE', 'Red', 'Cricket match is currently in progress', 'CricAPI detection'],
        ['closed', 'Red', 'Match date has passed, no results yet', 'Auto (past date)'],
        ['completed', 'Amber', 'Results entered, ready for settlement', 'Results saved / CricAPI match end'],
        ['settled', 'Green', 'All payments confirmed by receivers', 'Last Mark Paid click'],
    ]
    st = Table(status_data, colWidths=[65, 70, 170, 125])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(st)
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "<b>Flow:</b> open -> LIVE (CricAPI) -> closed (past date) -> completed (results entered) -> settled (all paid)",
        styles['Body']))
    story.append(PageBreak())

    # ==================== 8. FEATURES SUMMARY ====================
    story.append(Paragraph("8. Key Features Summary", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    features_data = [
        ['Feature', 'Description'],
        ['IPL Schedule Auto-Load', 'One-click loads all 70 IPL 2026 matches with league defaults'],
        ['League Defaults', 'Entry fee Rs.30, 10 players, 3 winners - configurable per league'],
        ['Winner Presets', '1-4 winners with smart percentage splits (e.g. 60/25/15)'],
        ['Screenshot OCR', 'Tesseract.js client-side image recognition - no server needed'],
        ['Manual Result Entry', 'Modal-based point entry, edit anytime before settlement'],
        ['Audit History', 'Every change logged with who, when, and before/after diffs'],
        ['CricAPI Live Data', 'Auto-detect live/ended matches, live score banner'],
        ['Auto-Close Matches', 'Past-dated open matches automatically shown as "closed"'],
        ['UPI Deep Links', 'One-tap payment on mobile via upi:// protocol'],
        ['Role-Based Actions', 'Pay button for payer only, Mark Paid for receiver only'],
        ['Season Standings', 'Cumulative earnings leaderboard across all matches'],
        ['Edit Match Settings', 'Change entry fee, max players, winners on open matches'],
        ['Chronological View', 'Matches grouped by date, today highlighted with badge'],
        ['Real-time Updates', 'All data uses Firestore onSnapshot for live sync'],
        ['Dark Theme', 'Sleek dark UI with custom color tokens'],
        ['Mobile-First', 'Responsive design, UPI links work natively on phones'],
    ]
    ft = Table(features_data, colWidths=[130, 300])
    ft.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(ft)
    story.append(PageBreak())

    # ==================== 9. TECH STACK ====================
    story.append(Paragraph("9. Tech Stack", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))
    story.append(Paragraph("<b>All services used are 100% free.</b>", styles['Body']))

    tech_data = [
        ['Technology', 'Purpose', 'Cost'],
        ['React 19 + Vite 8', 'Frontend UI framework + build tool', 'Free'],
        ['Tailwind CSS v4', 'Utility-first CSS styling', 'Free'],
        ['Firebase Auth', 'Email/password authentication', 'Free (Spark plan)'],
        ['Cloud Firestore', 'NoSQL database (Mumbai region)', 'Free (Spark plan)'],
        ['Tesseract.js', 'Client-side OCR for screenshot reading', 'Free'],
        ['CricAPI', 'Live cricket match data (100 calls/day)', 'Free tier'],
        ['Vercel', 'Hosting with auto-deploys from GitHub', 'Free tier'],
        ['React Router v7', 'Client-side SPA routing', 'Free'],
    ]
    techt = Table(tech_data, colWidths=[130, 230, 70])
    techt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#fafafa'), white]),
    ]))
    story.append(techt)
    story.append(Spacer(1, 30))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=TEXT_MUTED, spaceAfter=10))
    story.append(Paragraph("Built with Claude Code", styles['Footer']))
    story.append(Paragraph(
        '<link href="https://d11-league.vercel.app" color="#6366f1">https://d11-league.vercel.app</link> | '
        '<link href="https://github.com/anshulraj21/d11-league" color="#6366f1">github.com/anshulraj21/d11-league</link>',
        styles['Footer']))

    doc.build(story)
    print("PDF generated: docs/D11_League_Functional_Guide.pdf")

if __name__ == '__main__':
    build_pdf()
