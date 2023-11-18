const GITHUB_TOKEN = '';
const SONAR_TOKEN = '';
const NEWRELIC_TOKEN = '';
const sheetName = 'variaveis';
const org = 'rcelebrone';
const per_page = 100;
let urls_pos_start = 18;
let page = 1;
let repos = [];
let appsSlisNewrelic = '';

function main() {

  loadNewrelic();

  loadRepos();

  const urls = extractUrls(repos);

  const sheet = getCurrSheet();

  const currValues = getCurrValues(sheet).filter(x => x !== "");

  const diffUrls = urls.filter(x => !currValues.includes(x));

  const startAt = currValues.length + urls_pos_start;

  writeToSheet(sheet, diffUrls, startAt);
}

function debug() {
  return null
}

function writeToSheet(sheet, urls, startAt) {
  for(let i = 0; i < urls.length; i++) {
    // endereço do repo
    sheet.getRange(startAt + i, 3).setValue(urls[i]);

    const [owner, level, rfcLog, rfcRepoName, rfcLogRouting, rfcLogStandards, rfcHealthCheck, rfcHttpCode] = getCatalogInfo(urls[i]);
    sheet.getRange(startAt + i, 2).setValue(owner);
    sheet.getRange(startAt + i, 4).setValue(yOrN(level != undefined));
    sheet.getRange(startAt + i, 5).setValue(yOrN(rfcLog));
    sheet.getRange(startAt + i, 6).setValue(yOrN(rfcRepoName));
    sheet.getRange(startAt + i, 7).setValue(yOrN(rfcLogRouting));
    sheet.getRange(startAt + i, 8).setValue(yOrN(rfcLogStandards));
    sheet.getRange(startAt + i, 9).setValue(yOrN(rfcHealthCheck));
    sheet.getRange(startAt + i, 10).setValue(yOrN(rfcHttpCode));

    const hasSonar = getSonar(urls[i]);
    sheet.getRange(startAt + i, 11).setValue(yOrN(hasSonar));

    const hasIacRepo = getRepoIac(urls[i]);
    sheet.getRange(startAt + i, 12).setValue(yOrN(hasIacRepo));

    const hasGmud = getGmud(urls[i]);
    sheet.getRange(startAt + i, 13).setValue(yOrN(hasGmud));

    const repoName = urls[i].replace('rcelebrone/','');
    if(appsSlisNewrelic.search(repoName) > -1) {
      sheet.getRange(startAt + i, 14).setValue(yOrN(true));
    }

    sheet.getRange(startAt + i, 15).setValue(`${getSonarCloudInfos(repoName)}%`);
  }
}

function yOrN(isTrue) {
  return isTrue ? '100%' : '0%';
}

function extractUrls(repos) {
  let urls = [];
  for(let i = 0; i < repos.length; i++) {
    urls.push(repos[i].full_name);
  }
  return urls;
}

function getCurrSheet() {
  let spreadsheet = SpreadsheetApp.getActive();
  return spreadsheet.getSheetByName(sheetName);
}

function getCurrValues(sheet) {
  let temp_urls = [];
  let url_list = sheet.getRange("C"+urls_pos_start+":C"+repos.length).getValues();

  for(let i = 0; i < url_list.length; i++) {
    temp_urls.push(url_list[i][0]);
  }

  return temp_urls;
}

function getRepoTeam(repo) {
  let response = UrlFetchApp.fetch(`https://api.github.com/repos/${org}/${repo}/teams`, {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    let data = JSON.parse(response.getContentText());
    // TODO: pegar nome do time principal
    Logger.log(data);
}

function getCatalogInfo(org_repo) {
  try{
    const content = getGithubBlob(org_repo, 'catalog-info.yaml');
    
    const owner = getLine(content, 'owner')?.split(':')[1].trim();
    const level = getLine(content, '- level-')?.trim().split(' ')[1];
    const rfcLog = getLine(content, '- RFC_LOG') != undefined;
    const rfcRepoName = getLine(content, '- RFC_REPOSITORY_NAME') != undefined;
    const rfcLogRouting = getLine(content, '- RFC_LOG_ROUTING') != undefined;
    const rfcLogStandards = getLine(content, '- RFC_LOG_STANDARD_EVENTS') != undefined;
    const rfcHealthCheck = getLine(content, '- RFC_HEALTH_CHECK_STANDARD') != undefined;
    const rfcHttpCode = getLine(content, '- RFC_HTTP_RESPONSE_CODE') != undefined;

    return [owner, level, rfcLog, rfcRepoName, rfcLogRouting, rfcLogStandards, rfcHealthCheck, rfcHttpCode];
  }catch(e) {
    return "undefined";
  }
}

function loadNewrelic() {
  var url = "https://api.newrelic.com/graphql";

  var payload = {
    query: "{actor {entitySearch(queryBuilder: {type: APPLICATION}) {results {entities {serviceLevel {indicators {name}}}}}}}",
    variables: ""
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "API-Key": NEWRELIC_TOKEN
    },
    payload: JSON.stringify(payload)
  };

  var resposta = UrlFetchApp.fetch(url, options);

  JSON.parse(resposta.getContentText()).data.actor.entitySearch.results.entities.map((x) => {
    if(x.serviceLevel?.indicators) {
      appsSlisNewrelic += x.serviceLevel?.indicators.map((y)=> y.name);
    }
  });

  appsSlisNewrelic = appsSlisNewrelic.replace('-','').toLocaleLowerCase();
}

function obterDataHoraAtual() {
  var dataAtual = new Date();
  
  // Formatar a data e hora
  var formatoDataHora = Utilities.formatDate(dataAtual, 'GMT', 'yyyy--dd\'T\'HH::ssZ');
  
  return formatoDataHora;
}


function getSonarCloudInfos(url_repo) {
  var url = "https://sonarcloud.io/api/measures/search_history";

  var headers = {
    "Authorization": `Bearer ${SONAR_TOKEN}`
  };

  var queryParams = {
    "component": `rcelebrone_${url_repo}`,
    "metrics": "violations,bugs,code_smells,vulnerabilities,security_hotspots,coverage,lines_to_cover,uncovered_lines,duplicated_lines_density,duplicated_lines,ncloc",
    "branch": "production",
    "to": obterDataHoraAtual(),
  };

  var queryString = Object.keys(queryParams)
    .map(function(key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]);
    })
    .join("&");

  var finalUrl = url + "?" + queryString;

  var opcoesRequisicao = {
    method: "get",
    headers: headers
  };

  try {
    var resposta = UrlFetchApp.fetch(finalUrl, opcoesRequisicao);

    const log = JSON.parse(resposta.getContentText()).measures.filter((x)=>x.metric==="coverage");

    const coverage = (log[0].history[log[0].history.length-1]).value;
  
    return coverage.toLocaleString("pt-BR", { minimumFractionDigits: 1 }).replace("undefined","0").replace(".",",");
  } catch(e) {
    Logger.log(e);
    return 0;
  }
}

function getSonar(org_repo) {
  try{
    const content = getGithubBlob(org_repo, '.github/workflows/sonarqube.yml');
    
    let hasSonar = getLine(content, 'uses: SonarSource/sonarcloud-github-action') != undefined;

    if(!hasSonar) {
      const content = getGithubBlob(org_repo, '.github/workflows/build.yml');
    
      hasSonar = getLine(content, 'uses: SonarSource/sonarcloud-github-action') != undefined;
    }

    return hasSonar;
  }catch(e) {
    return "undefined";
  }
}

function getGmud(org_repo) {
  try{
    const content = getGithubBlob(org_repo, '.github/workflows/gmud.yml');
    
    const hasGmud = getLine(content, 'uses: rcelebrone/action-generate-gmud-sre') != undefined;

    return hasGmud;
  }catch(e) {
    return "undefined";
  }
}

function getRepoIac(org_repo) {
  try{
    const content = getGithubBlob(org_repo.replace('rcelebrone/','rcelebrone/iac-'), 'infrastructure/main.tf');
    
    return true;
  }catch(e) {
    return false;
  }
}

function getGithubBlob(org_repo, path) {
  try{
    let response = UrlFetchApp.fetch(`https://api.github.com/repos/${org_repo}/contents/${path}`, {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    return Utilities.newBlob(Utilities.base64Decode(JSON.parse(response.getContentText()).content)).getDataAsString();
  }catch(e) {
    return "undefined";
  }
}

function getLine(content, pattern) {
  return content.split('\n').find(line => line.includes(pattern));
}

function loadRepos() {
    let response = UrlFetchApp.fetch(`https://api.github.com/orgs/${org}/repos?per_page=${per_page}&page=${page}`, {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `token ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    let data = JSON.parse(response.getContentText());

    repos.push(...data);
    
    if (data.length === per_page) {
        page++;
        loadRepos();
    }
}
