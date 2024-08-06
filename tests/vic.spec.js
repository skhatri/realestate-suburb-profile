const {test, expect} = require('@playwright/test')
const ui = require('./uihelper');
const blog = require('./blog');
const suburbs = require('./suburbs');
const {chromium} = require('playwright');
let userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const fs = require("fs");

let wait = async (n) => {
    return new Promise(resolve => setTimeout(resolve, n));
};

var downloadStateData = async ({page, state, limit = 1}) => {
    let top = suburbs.states[state];
    let count = 0;
    for (let i = 0; i < top.length; i++) {
        let suburb = top[i].suburb;
        let postcode = top[i].postcode;
        let desiredName = `data/${state}/${suburb}-${postcode}.json`;
        if (fs.existsSync(desiredName)) {
            console.log(`data for ${suburb}, ${state} exists in ${desiredName}`);
            continue;
        }
        let links = await extractSuburbData({page, state: state, suburb: suburb, postcode: postcode});
        if (links && links.length > 0) {
            fs.writeFileSync(desiredName, JSON.stringify(links), {
                encoding: "utf-8"
            });
        }
        let sleep = ((Math.random() * 10) * 1000).toFixed(0);
        console.log(`sleep for ${sleep} ms`);
        await wait(sleep);
        count++;
        if (count === limit) break;
    }
};

let randomScroll = async (page, minPercent = 0, maxPercent = 100) => {
    await page.evaluate(({min, max}) => {
        const maxScrollY = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        ) - window.innerHeight;

        const scrollPercent = Math.random() * (max - min) + min;
        const randomScrollY = Math.floor((scrollPercent / 100) * maxScrollY);

        window.scrollTo(0, randomScrollY);
    }, {min: minPercent, max: maxPercent});
};

var extractSuburbData = async ({page, state, suburb, postcode}) => {
    const blogBase = 'https://www.realestate.com.au';
    const target = `${state}/${suburb}-${postcode}`;
    console.log(`${blogBase}/${target}/`);
    let url = `${blogBase}/${target}/`;
    await page.goto(url, {referer: "https://www.realestate.com.au/"});

    let bedTypes = [
        {name: "all", id: "#house-price-data-buy-all-bedrooms"},
        {name: "3", id: "#house-price-data-buy-3-bedrooms"},
        {name: "4", id: "#house-price-data-buy-4-bedrooms"}
    ];

    const medianPriceSelectorTemplate = " > div > div.indexstyles__PriceContainer-sc-10e5b9w-2.kHpnks > div.indexstyles__MedianPriceWrapper-sc-10e5b9w-7.gbCFTW > span.indexstyles__PriceText-sc-10e5b9w-4.ldaYXV";
    const growthSelectorTemplate = " > div > div.indexstyles__PriceContainer-sc-10e5b9w-2.kHpnks > div.MedianPriceGrowth__GrowthWrapper-sc-1styeqa-0.kXLSlS > small > p";
    const soldSelectorTemplate = " > div > div.indexstyles__InsightsWrapper-sc-10e5b9w-8.dJAonX > div > div:nth-child(2) > span.MarketInsights__InsightText-sc-63txnk-4.chshui > span.Text__Typography-sc-vzn7fr-0.kqMDKl";
    const yieldSelectorTemplate = " > div > div.indexstyles__InsightsWrapper-sc-10e5b9w-8.dJAonX > div > div:nth-child(5) > span.MarketInsights__InsightText-sc-63txnk-4.chshui > span.Text__Typography-sc-vzn7fr-0.kqMDKl";

    await page.waitForTimeout(3000);
    await page.screenshot({path: `example-page.png`});
    let links = [];
    //$("#house-price-data-buy-3-bedrooms  > div > div.indexstyles__PriceContainer-sc-10e5b9w-2.kHpnks > div.indexstyles__MedianPriceWrapper-sc-10e5b9w-7.gbCFTW > span.indexstyles__PriceText-sc-10e5b9w-4.ldaYXV")
    for (let i = 0; i < bedTypes.length; i++) {
        let bedroomOption = bedTypes[i].id;
        let medianPriceSelector = `${bedroomOption}${medianPriceSelectorTemplate}`;
        let growthSelector = `${bedroomOption}${growthSelectorTemplate}`;
        let soldSelector = `${bedroomOption}${soldSelectorTemplate}`;
        let yieldSelector = `${bedroomOption}${yieldSelectorTemplate}`;

        let medianPrice = await ui.findElementText(page, medianPriceSelector);
        let yieldValue = await ui.findElementText(page, yieldSelector);
        let soldValue = await ui.findElementText(page, soldSelector);
        let growthValue = await ui.findElementText(page, growthSelector);
        if (medianPrice) {
            let suburbProfileData = {
                state: state,
                postcode: postcode,
                suburb: suburb,
                bedroomType: bedTypes[i].name,
                medianPrice: medianPrice,
                yieldValue: yieldValue,
                growth: growthValue,
                sold: soldValue
            };
            links.push(suburbProfileData);
        }
        await randomScroll(page, 30, 70);
        await wait(500);
        await randomScroll(page, 20, 80);
    }
    return links;
};

var checkBrowserAgent = async ({page}) => {
    await page.goto('https://httpbin.io/user-agent');
    const pageContent = await page.content();
    console.log(pageContent);
};

test.setTimeout(0);

const profile1 = {
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-ch-ua-platform": "macOS",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "referer": "https://www.realestate.com.au/australia/",
    "priority": "u=0, i",
    "dnt": "1",
    "cookie": "mid=3372962885177911659; External=%2FTRIPLELIFT%3D2520805492345566363127%2F_EXP%3D1751182991%2F_exp%3D1753105361; reauid=cf58d617b7430000c90bae66b402000040241a00; Country=AU; split_audience=e; AMCVS_341225BE55BBF7E17F000101%40AdobeOrg=1; VT_LANG=language%3Den-US; s_ecid=MCMID%7C52192011881225560700909801452557254633; s_cc=true; _gcl_au=1.1.1028120061.1722682316; DM_SitId1464=1; DM_SitId1464SecId12708=1; _cb=DpRtoeBSIMKiCulRIx; _chartbeat2=.1722688046657.1722688046657.1.rPaoOC3OooHDCeTggBB1LLbrroGZ.1; topid=REAUID:CF58D617B7430000C90BAE66B402000040241A00; QSI_HistorySession=https%3A%2F%2Fwww.realestate.com.au%2Fvic%2Fhawthorn-3122%2F~1722687779737%7Chttps%3A%2F%2Fwww.realestate.com.au%2Fvic%2Fbentleigh-3204%2F~1722687891730%7Chttps%3A%2F%2Fwww.realestate.com.au%2Fnews%2Fvictorian-suburbs-to-watch-in-2024-home-buyers-to-search-further-afield-for-value%2F~1722688047848%7Chttps%3A%2F%2Fwww.realestate.com.au%2Fvic%2Ftoorak-3142%2F~1722688105777%7Chttps%3A%2F%2Fwww.realestate.com.au%2Fvic%2Fbrighton-3186%2F~1722688191500; KFC=PTuf3MBUxU5W8xbruyvrNyO6c1ie8dNI/iU+KAf4WVg=; _gid=GA1.3.980768403.1722846896; _sp_ses.2fe7=*; AMCV_341225BE55BBF7E17F000101%40AdobeOrg=-330454231%7CMCIDTS%7C19941%7CMCMID%7C52192011881225560700909801452557254633%7CMCAAMLH-1723461559%7C8%7CMCAAMB-1723461559%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1722863959s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C3.1.2; s_sq=%5B%5BB%5D%5D; KP_UIDz-ssn=09jHl7cCW5hi2NAt36nykEkgTper7nDi0CbJ8p4hV5bU47FAN7TKe08NOiHt94w9S67649CLQXANbGaZAJw3piRw8wpPzMtAohRfxZd7DH8PHjZv0it548g1UqahZDOKMQFzUtak5R8VfhxW37OEHrwL5yauXo6OxJL; KP_UIDz=09jHl7cCW5hi2NAt36nykEkgTper7nDi0CbJ8p4hV5bU47FAN7TKe08NOiHt94w9S67649CLQXANbGaZAJw3piRw8wpPzMtAohRfxZd7DH8PHjZv0it548g1UqahZDOKMQFzUtak5R8VfhxW37OEHrwL5yauXo6OxJL; _ga_F962Q8PWJ0=GS1.1.1722856760.4.1.1722858343.0.0.0; s_nr30=1722858345372-Repeat; _sp_id.2fe7=e05fb71b-cdb3-4012-a409-ecfa2211af8b.1722682316.5.1722858346.1722853921.e99f43f9-2dfb-4210-8874-dd574e49b15b; utag_main=v_id:019117de11d9001c7dcf4b35d6eb05075002806d0093c$_sn:5$_se:6$_ss:0$_st:1722860144282$vapi_domain:realestate.com.au$dc_visit:5$_prevpage:rea%3Amarket%20explorer%3Asuburb%20details%3Bexp-1722861945365$ses_id:1722856759602%3Bexp-session$_pn:5%3Bexp-session$dc_event:6%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session; nol_fpid=mdcwv94xjmyihccrgvcnctcupkhvh1722682316|1722682316455|1722858346448|1722858346617; _ga_3J0XCBB972=GS1.1.1722856760.4.1.1722858346.0.0.0; _ga=GA1.3.776204822.1722682316; _gat_gtag_UA_143679184_2=1",
    "cache-control": "max-age=0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,fr;q=0.8",
};

const profile2 = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,fr;q=0.8",
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "mid=3372962885177911659; External=%2FTRIPLELIFT%3D2520805492345566363127%2F_EXP%3D1751182991%2F_exp%3D1753105361; reauid=cf58d617b7430000c90bae66b402000040241a00; Country=AU; split_audience=e; AMCVS_341225BE55BBF7E17F000101%40AdobeOrg=1; VT_LANG=language%3Den-US; s_ecid=MCMID%7C52192011881225560700909801452557254633; s_cc=true; _gcl_au=1.1.1028120061.1722682316; DM_SitId1464=1; DM_SitId1464SecId12708=1; _cb=DpRtoeBSIMKiCulRIx; _chartbeat2=.1722688046657.1722688046657.1.rPaoOC3OooHDCeTggBB1LLbrroGZ.1; topid=REAUID:CF58D617B7430000C90BAE66B402000040241A00; KFC=PTuf3MBUxU5W8xbruyvrNyO6c1ie8dNI/iU+KAf4WVg=; _gid=GA1.3.980768403.1722846896; DM_SitId1464SecId12707=1; s_sq=%5B%5BB%5D%5D; KP_UIDz-ssn=0a8YMCljzAK9YE7kYeGoZ4UuGseCmyPqWhcdz5yzK52XQRTD6DxPqqjozGWnKHBekTGlzzQFvWPq3YhvFdKYQdo28lVbDq5XjHtKKCH60F63hIH306Eib0KBoXZHfZ80uBnNCrAGPrAFa4GwzOmqwMhwcQMmxGiShRA; KP_UIDz=0a8YMCljzAK9YE7kYeGoZ4UuGseCmyPqWhcdz5yzK52XQRTD6DxPqqjozGWnKHBekTGlzzQFvWPq3YhvFdKYQdo28lVbDq5XjHtKKCH60F63hIH306Eib0KBoXZHfZ80uBnNCrAGPrAFa4GwzOmqwMhwcQMmxGiShRA; s_nr30=1722941256766-Repeat; _sp_ses.2fe7=*; _sp_id.2fe7=e05fb71b-cdb3-4012-a409-ecfa2211af8b.1722682316.7.1722941257.1722863300.ab9199b4-d054-4e63-86c3-d761019256d3; AMCV_341225BE55BBF7E17F000101%40AdobeOrg=-330454231%7CMCIDTS%7C19941%7CMCMID%7C52192011881225560700909801452557254633%7CMCAAMLH-1723546056%7C8%7CMCAAMB-1723546056%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1722948456s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C3.1.2; utag_main=v_id:019117de11d9001c7dcf4b35d6eb05075002806d0093c$_sn:7$_se:1$_ss:1$_st:1722943056671$vapi_domain:realestate.com.au$dc_visit:7$ses_id:1722941256671%3Bexp-session$_pn:1%3Bexp-session$_prevpage:rea%3Amarket%20explorer%3Alanding-page%3Bexp-1722944856765$dc_event:1%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session; _gat_gtag_UA_143679184_2=1; _ga_3J0XCBB972=GS1.1.1722941255.6.1.1722941258.0.0.0; _ga=GA1.1.776204822.1722682316; _ga_F962Q8PWJ0=GS1.1.1722941258.6.0.1722941258.0.0.0; nol_fpid=mdcwv94xjmyihccrgvcnctcupkhvh1722682316|1722682316455|1722941257713|1722941258627; QSI_HistorySession=https%3A%2F%2Fwww.realestate.com.au%2Faustralia%2F~1722941259754",
    "Referer": "https://www.google.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

test('suburb', async () => {
    // Launch the Chromium browser
    const browser = await chromium.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        extraHTTPHeaders: profile2
    });

    // Create a new page in the browser context and navigate to target URL
    const page = await context.newPage();
    await downloadStateData({page, state: "vic", limit: 6});
    //await downloadStateData({page, state: "vic"});
    //await downloadStateData({page, state: "tas"});

    // Close the browser
    await browser.close();
});

