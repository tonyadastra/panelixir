## PanElixir - Global COVID-19 Vaccine and Treatment Tracker

#### **Divisions and Internal Links**
+ ##### [Auto-Update NYTimes Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateNYTimes)

**Recent Updates**
+ November 16 - Bug Fixes, Append logo and other tags if values are not empty in database
+ November 15 - Full Auto-Update NYTimes Deployed

**To Do List**
* [ ] WHO Website Auto-Update
* [ ] Country Dropdown Query from Database
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