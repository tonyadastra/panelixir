# PanElixir - Global COVID-19 Vaccine Tracker

## **Divisions and Internal Links**
+ ### [Auto-Update NYTimes Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateNYTimes)
+ ### [Auto-Update Google Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateGoogle)
+ ### [Auto-Update USA Distribution Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateUSADistribution)
+ ### [Auto-Update World Vaccinations Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateWorldVaccinations)


## **Recent Updates**
+ January 11 - (Update 4) Add increase new vaccinations per hundred; Fix mobile filter modal; other optimizations
+ January 11 - (Update 3) Extend world-map table to all countries with vaccination data
+ January 11 - (Update 2) Add font files to local; other map styling optimizations
+ January 11 - New: Table showing new vaccinations; add date to world map tooltip, adjust us map tooltip position mobile, other styling optimizations
+ January 10 - (Update 2) New: Bar Graph for WorldMap
+ January 10 - New: WorldMap, new tooltip; USMap - PointerEvents, adjust tooltip; other styling optimizations
+ January 7 - New: Map - Fetch US distribution data from database(AWS Lambda AutoUpdate Database every hour), DC individual block, Tooltip position
+ January 5 - (Update 2) New: Age Group; Optimize Meta description, remove console logs
+ January 5 - New: Top News; Fix Tooltip, Add Percentage Sign
+ January 1 - Fix omitted 10 states & add US Total to map table; Styling Optimizations in FAQ
+ December 31 - (Update 2) Science + People and Stories
+ December 31 - All-in-one page, NavBar, Move 'Distribution' to Top; Temporarily Hide Map
+ December 28 - Complete Vaccine Availability: Optimize USMap, add a table; Start FAQs and link; Update card images; add text on image
+ December 25 - Complete Card Designs and two categories: Vaccine Development, Vaccine Availability
+ December 22 - Add compare table Pfizer vs. Moderna
+ December 21 - Add trial size and side effects, hide intros for vaccines near approval/approved/under EUA
+ December 11 - Add approved and limited use countries to vaccine intro; icons update
+ December 10 - Add Abandoned to filter and intro, optimize existing styles, add approved countries
+ December 9 - Release Approval and Detailed Vaccine Information
+ November 30 - Restyling and fix existing bugs
+ November 27 - General Vaccine News and Optimize
+ November 24 - Optimize CSS for display-company, card.js not show 'Latest News' if data-news is not None but is empty
+ November 19 - Optimize Append Card JS(Does not return 'No results to fetch' for card), Add spinner when loading vaccine intro
+ November 18 - Auto Generate Country Dropdowns Based on INFO database
+ November 17 - Optimize AutoUpdate Algorithm and find vaccine platform using bs4
+ November 16 - Bug Fixes, Append logo and other tags if values are not empty in database
+ November 15 - Full Auto-Update NYTimes Deployed

## **To Do List**
* [ ] WHO Website Auto-Update
* [ ] Register/Login => Send latest information via e-mail, Comments
* [ ] More information in database (doses, expected release date, etc.)
* [ ] Logo Design
* [ ] Info Icon to learn more (about Special Vaccines)
* [ ] Vaccine Type Categories Explanation
* [ ] Weekly Report on Vaccines - (comparison?)
* [ ] Optimize CSS and JS files
* [ ] Add-ons to map - display country and other information on hover
* [ ] G-Zip Compression
* [X] Full Auto-Update Data NYTimes Website
* [X] Update General Vaccine News from Google
* [X] Country Dropdown Query from Database
* [X] Add spinner while loading card
* [X] Optimize Append Card JS
* [X] Only append logo, country tag, type tag if values in database are not empty
* [X] Find AutoUpdateNYTimes AWS Lambda Function Logs
* [X] Optimize INFO database - remove 'logo' column (Auto-generated based on 'company' and 'vac_id'!)
* [X] Optimize lambda function to update INFO database(stage and update_time) and return statements
* [X] Optimize INFO database - remove 'flag' column (Auto-generated based on 'country'!)
* [X] Auto-Update Latest News Section from NYTimes Website
* [X] Latest News Section Update in Database (Avoid re-uploading code every time)
* [X] Add "search" on Country / Region Dropdown
* [X] Non-www redirect - all redirect to https://www.panelixir.com
* [X] Add Preloader
* [X] Optimize HTML Documents (remove unnecessary HTMLs for vaccine introduction AJAX)
* [X] Auto-generate Latest-Update on top based on date in database
* [X] Latest News ORDER BY Top
* [X] Add update date in each vaccine introduction
* [X] Database Security
* [X] Add HTTPS Certificate
* [X] Latest News Section
* [X] Modal For Mobile Version
* [X] WHO Vaccine Type Filtering
* [X] Pre-Clinical Vaccines Introduction (Multi-Vaccines for same company?)
* [X] Map Optimization (Taking up 100%+ CPU)
* [X] Disclaimer
* [X] Feedback Form (Submit Data & Bug Report) - Link in Quick Access
* [X] Russia Early Approval


**Quick Access:**
1. [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
2. [Submit Data - Google Forms](https://docs.google.com/forms/d/1UNOq6-FG93ysnf9Qz9wue7jy_IV_Kkay38vr3I4aEsc/edit?usp=sharing)
3. [Bug Report - Google Forms](https://docs.google.com/forms/d/1fPws_MFtqO4bLWH_1xhLt4AEEcYHpdQt8DiRNabJc-Y/edit?usp=sharing)
4. [D3 API Reference(Wiki)](https://github.com/d3/d3/blob/master/API.md)
5. [Nature Article - Different Vaccine Platforms](https://www.nature.com/articles/s41563-020-0746-0)
6. [US clinicaltrials.gov COVID-19 Vaccines](https://clinicaltrials.gov/ct2/results?cond=Covid19&term=&type=Intr&rslt=&age_v=&gndr=&intr=Vaccine&titles=&outc=&spons=&lead=&id=&cntry=&state=&city=&dist=&locn=&rsub=&strd_s=&strd_e=&prcd_s=&prcd_e=&sfpd_s=&sfpd_e=&rfpd_s=&rfpd_e=&lupd_s=&lupd_e=&sort=)
7. [Chinese Clinical Trial Registration COVID-19 Vaccines](http://www.chictr.org.cn/searchprojen.aspx?title=vaccine&officialname=&subjectid=&secondaryid=&applier=&studyleader=&ethicalcommitteesanction=&sponsor=&studyailment=COVID-19&studyailmentcode=&studytype=0&studystage=0&studydesign=0&minstudyexecutetime=&maxstudyexecutetime=&recruitmentstatus=0&gender=0&agreetosign=&secsponsor=&regno=&regstatus=0&country=&province=&city=&institution=&institutionlevel=&measure=&intercode=&sourceofspends=&createyear=0&isuploadrf=&whetherpublic=&btngo=btn&verifycode=&page=1)

**Resources**
1. [The New York Times Vaccine Tracker](https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html)
2. [The Lancet Coronavirus Resource Center](https://www.thelancet.com/coronavirus?dgcid=kr_pop-up_tlcoronavirus20)
3. [World Health Organization Vaccine Data](https://www.who.int/publications/m/item/draft-landscape-of-covid-19-candidate-vaccines)
4. [NYT Article - *Different Approaches to a Vaccine*](https://www.nytimes.com/interactive/2020/05/20/science/coronavirus-vaccine-development.html?action=click&module=RelatedLinks&pgtype=Article)
5. [Operation Warp Speed - US HHS](https://www.hhs.gov/coronavirus/explaining-operation-warp-speed/index.html)
7. [D3.ease(transition examples)](https://observablehq.com/@d3/easing-animations)