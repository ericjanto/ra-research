import fs from 'fs';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';


const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
const options_acc = { logLevel: 'info', output: 'html', onlyCategories: ['accessibility'], port: chrome.port };
const options_perf = { logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port };
const options_seo = { logLevel: 'info', output: 'html', onlyCategories: ['seo'], port: chrome.port };

let frameworkURLs = JSON.parse(fs.readFileSync('framework-urls.json', 'utf8'));


var stats = {}
// const average = array => array.reduce((a, b) => a + b) / array.length;

function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

for (let frameworkName in frameworkURLs) {
    console.log(`Producing reports for framework ${frameworkName}`)

    var scores = []

    let urlGroup = frameworkURLs[frameworkName]

    try {
        for (let i = 0; i < urlGroup.length; i++) {
            let score = await produceAccessibilityReport(urlGroup[i], frameworkName, i)
            scores.push(score)
            await producePerformanceReport(urlGroup[i], frameworkName, i)
            await produceSEOReport(urlGroup[i], frameworkName, i)
        }   
    } catch (error) {
        continue
    }

    stats[frameworkName] = {
        'min': Math.min(...scores),
        'max': Math.max(...scores),
        'median': median(scores)
    }


    if (frameworkName == "joomla") {
        fs.writeFileSync('scores.json', JSON.stringify(stats))
    }
}


async function produceAccessibilityReport(url, frameworkName, i) {
    const runnerResult = await lighthouse(url, options_acc);

    // `.report` is the HTML report as a string
    const reportHtml = runnerResult.report;

    // `.lhr` is the Lighthouse Result as a JS object
    console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
    const score = runnerResult.lhr.categories.accessibility.score * 100
    console.log('Accessibility score was', score);

    fs.writeFileSync(`accessibility_reports/lhreport-${frameworkName}-score-${score}-url-${i}.html`, reportHtml);
    return score
}

async function producePerformanceReport(url, frameworkName, i) {
    const runnerResult = await lighthouse(url, options_perf);

    // `.report` is the HTML report as a string
    const reportHtml = runnerResult.report;

    // `.lhr` is the Lighthouse Result as a JS object
    console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
    const score = runnerResult.lhr.categories.performance.score * 100
    console.log('Performance score was', score);

    fs.writeFileSync(`performance_reports/lhreport-${frameworkName}-score-${score}-url-${i}.html`, reportHtml);
}

async function produceSEOReport(url, frameworkName, i) {
    const runnerResult = await lighthouse(url, options_seo);

    // `.report` is the HTML report as a string
    const reportHtml = runnerResult.report;

    // `.lhr` is the Lighthouse Result as a JS object
    console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
    const score = runnerResult.lhr.categories.seo.score * 100
    console.log('SEO score was', score);

    fs.writeFileSync(`seo_reports/lhreport-${frameworkName}-score-${score}-url-${i}.html`, reportHtml);
}

await chrome.kill();