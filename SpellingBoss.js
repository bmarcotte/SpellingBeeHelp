(() => {            // OUTER SHELL
'use strict';
alert('Bookmarklet works');
/*
//======================================
// GET HINTS HTML
//======================================

// const date = new Date(document.querySelector('.pz-game-date').textContent);
// const hintsUrl = 'https://www.nytimes.com/' +
//     date.toISOString().slice(0, 10).replaceAll('-', '/') +
//     '/crosswords/spelling-bee-forum.html';

// KLUDGE FOR DEVELOPMENT
const hintsUrl = 'C:/Users/neuch/OneDrive/Documents/JavaScript/SpellingBeeHelp/Hints.html';

fetch(hintsUrl).then(response => response.text()).then(html => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const hints = div.querySelector('.interactive-body > div');
  main(hints);
  alert(hints.slice(0,88));
});


//======================================
// MAIN FUNCTION
//======================================

function main(hints) {
    const paragraphs = hints.querySelectorAll('p');
    const letters = paragraphs[1].textContent.replace(/\s/g, '');
    alert(letters);
    // Initialize
  
  

//--------------------------------------
// MAIN VARIABLES
//--------------------------------------

// const El = {
    // Wrapper: document.getElementById('wrapper'),        // temporary
    // InitHints: document.getElementById('init_hints'),   // temporary
    // UpdateList: document.getElementById('update_list'), // temporary
    // MetaStats1: document.getElementById('metastats1'),
    // MetaStats2: document.getElementById('metastats2'),
    // MetaStats3: document.getElementById('metastats3'),
    // MetaStats4: document.getElementById('metastats4'),
    // Table: document.getElementById('table'),
    // MainHTML: document.getElementById('main'),          // temporary
    // HintsHTML: document.getElementById('hints'),        // temporary
// }

let Char1Obj = {            // Char1List obj
    char1: '',
    rowStart: 0,            // letter subtotals row in Table
    rowEnd: 0,              // last data row in Table, not col totals
    count: [],              // word length subtotals
    total: 0,               // total number of words
    colSum() {
        for (let j = ColStart - 2; j <= ColEnd; j++) {
            if (j == ColStart - 1) continue;
            let sum = 0;
            for (let i = this.rowStart + 1; i <= this.rowEnd; i++) {
                sum += Table[i][j];
            }
            Table[this.rowEnd + 1][j] = sum;
        }
        return;
        },
    rowSum() {
        for (let i = this.rowStart + 1; i <= this.rowEnd + 1; i++) {
            let sum = 0;
            for (let j = ColStart; j <= ColEnd; j++) {
                sum += Table[i][j];
            }
            Table[i][2] = sum;
        }
        return;   
    },    
};
let Char2Obj = {            // Char2List obj
    char2: '',
    count: 0,               // count of each Char2
    row: 0,                 // Table row
};

let Char1List = [];         // holds index pointers into Table
let Char2List = [];
let Char1Table = [];        // raw data tables
let Char2Table = [];

let LineBreak = ['-', '-', '-', '-'];
let Spacer = ['', '', '', '',];
let Header = ['', '', '', ''];
let Cell = [];              // holds element references for Table
let Table = [];             // holds display data
const ColStart = 4;         // table dimensions
let ColEnd = 0;
let TableTotalRows = 0;
let ColLabel = ['', '', '', ''];  // letter count columns with data
 
let WordsTotal = 0;         // Metastats
let WordsFound = 0;
let Pangrams = 0;
let PangramsFound = 0;
let Points = 0;
let Genius = 0;
let LetterList = "";        // needed to find pangrams

const date = new Date(document.querySelector('pz-game-date').textContent);
const hintsUrl = 'https://www.nytimes.com/' +
    date.toISOString().slice(0, 10).replaceAll('-', '/') +
    '/crosswords/spelling-bee-forum.html';
    alert(hintsUrl);

let MainHTML = '';          // Spelling Bee main program HTML
let HintsHTML = '';         // Today's Hints HTML
let GameDate = '';
let DataInput = [];         // list of found words
let ProcessedWords = [];    // list of already tabulated words

// -------------------------------------
function InitializeHints () {
// -------------------------------------
    let index;
    let temp;

    // MetaStats
    index = HintsHTML.indexOf("</p>", HintsHTML.indexOf(" Center letter is in "));
    temp = GetHTMLelement('<p class="content">WORDS', HintsHTML, index).split(/[^A-Za-z0-9]+/);
        WordsTotal = temp[1];
        Points = temp[3];
        Pangrams = temp[5];
            if (temp.length > 5) Pangrams = Pangrams + ' (' + temp[6] + ' Perfect)';
    LetterList = GetHTMLelement('<span style="font-weight:700;">', HintsHTML, index).split(/[^A-Za-z]+/)[1].toUpperCase();
    LetterList += " " + GetHTMLelement('<span>', HintsHTML, index ).toUpperCase();
    index = MainHTML.indexOf('</span>', MainHTML.indexOf('<span class="sb-modal-rank">Genius</span>'));
        Genius = GetHTMLelement('</span>', MainHTML, index).split(/[^0-9]+/)[1];
    UpdateMetaStats();

    // Get Char1 table
    GetChar1Table();           // returns Char1 table data from HTML code (NO column for blank letter counts)

    // Linebreak, Spacer, Header row templates
    ColLabel.length = 4;
    for (let i = 1; i < Char1Table[0].length - 1; i++) {
        ColLabel[i + 3] = Number(Char1Table[0][i]);
        Header[ColLabel[i + 3]] = ColLabel[i + 3];
        }
    ColEnd = Number(Header[Header.length-1]);
    LineBreak.length = ColEnd + 1;
    LineBreak.fill('-', 4, ColEnd + 1);
    Spacer.length = ColEnd + 1;
    Spacer.fill('', 4, ColEnd + 1);
    for (let i = 4; i < ColEnd; i++) {
        if (Header[i] === undefined) Header[i] = '';
    }
    Char1Table.splice(0, 1);        // remove header row
    GetCharLists();                 // returns Char2 table, Char1 and Char2 lists, Table
    TableTotalRows = Char2List.length + (Char1List.length * 5);
    CreateHTMLTable();
    DisplayTable();
    TableInitialized = true;
    return;
}

function GetChar1Table () {
    let TRstart;
    let TRend;
    let index = HintsHTML.indexOf('<table>', HintsHTML.indexOf('Center letter is in'));
    let text = HintsHTML.slice(index, HintsHTML.indexOf('</table>', index) + 8);
    TRstart = Array.from(text.matchAll("<tr>"));
    TRend = Array.from(text.matchAll("</tr>"));
    for (let i = 0; i < TRstart.length; i++) {
        let TRtext = text.slice(TRstart[i].index, TRend[i].index + 5);
        let temp = [];
        index = TRtext.indexOf("<td");
        while (index >= 0) {
            temp.push(GetHTMLelement("<td", TRtext, index));
            index = TRtext.indexOf("<td", index + 3);
        }
        Char1Table.push(temp);
    }
    // Capitalize, numerize, and change "-" to "0"
    for (let i = 0; i < Char1Table.length; i++) {
        Char1Table[i][0] = Char1Table[i][0].toUpperCase();
        for (let j = 1; j < Char1Table[i].length; j++) {
            if (Char1Table[i][j] == '-') Char1Table[i][j] = 0;
            Char1Table[i][j] = Number(Char1Table[i][j]);
        }
    }
    return;
}

function GetCharLists () {
// Create Char2Table
// Simultaneously create Char1List, Char2List, and Table

    let temp = [];
    let text = HintsHTML.slice(HintsHTML.indexOf(">Two letter list:</p>") + 30);
    text = text.slice(0, text.indexOf('</p>') + 5);
    let TRstart = Array.from(text.matchAll("<span>"));
    let TRend = Array.from(text.matchAll("<br>"));
    let Char2Table = [];                        // create Char2Table
    for (let i = 0; i < TRstart.length; i++) {
        Char2Table.push(text.slice(TRstart[i].index + 5, TRend[i].index).toUpperCase().split(/[^A-Za-z0-9]+/).filter(x => x));
    }
    let ch2Indx = 0;                            // iterates through Char2List
    let chTableIndx = 0;                        // iterates through Char1List and Char1Table/Char2Table
    let char1TableLen = Char1Table[0].length;
    let row = 3;
    for (let i = 0; i < Char1Table.length - 1; i++) {     // iterate over each Char1Table row
        Table.push(LineBreak);
        Table.push(Spacer);
        Table.push(Header);
        Char1List[chTableIndx] = Object.assign({}, Char1Obj);   // Char1 line
        Char1List[chTableIndx].char1 = Char1Table[chTableIndx][0];
        Char1List[chTableIndx].rowStart = row;
        Char1List[chTableIndx].rowEnd = row + (Char2Table[chTableIndx].length / 2);
        Char1List[chTableIndx].total = Char1Table[chTableIndx][Char1Table[chTableIndx].length - 1];
        temp = ['Letter', 'Σ', '#', 'Σ>'];
        temp.length = ColEnd + 1;
        temp.fill(0, 4, ColEnd + 1);
        for (let j = 4; j < ColLabel.length; j++) {         // Char1 stats line
            temp[ColLabel[j]] = Char1Table[chTableIndx][j - 3];
        }
        Table.push(temp);
        row++;
        for (let j = 0; j < Char2Table[chTableIndx].length; j++) {  // Char2 lines
            Char2List[ch2Indx] = Object.assign({}, Char2Obj);
            Char2List[ch2Indx].row = row;
            Char2List[ch2Indx].char2 = Char2Table[chTableIndx][j];
            j++;
            Char2List[ch2Indx].count = Char2Table[chTableIndx][j];
            temp = [Char2List[ch2Indx].char2, Char2List[ch2Indx].count, 0, ''];
            temp.length = ColEnd + 1;
            temp.fill(0, 4, ColEnd + 1);
            Table.push(temp);
            ch2Indx++;
            row++;
        }                                     // Summary line  >>>> MOVE THIS JUST BELOW LETTER SUBTOTAL LINE
        temp = ['Σ', Char1Table[chTableIndx][char1TableLen - 1], 0, ''];      // change to ['', Char1List[indexList1].total, 0, 'Σ']
        temp.length = ColEnd + 1;
        temp.fill(0, 4, ColEnd + 1);
        Table.push(temp);
        row +=4;
        chTableIndx++;
    }
    return;
}

function CreateHTMLTable() {
    for (let y = 0; y < TableTotalRows; y++) {
        let rowObj = [];
        let rowEl = document.createElement('tr');
        for (let x = 0; x <= ColEnd; x++) {
            let cellEl = document.createElement('td');
            rowObj.push({element: cellEl});
            rowEl.appendChild(cellEl);
        }
        Cell.push(rowObj);
        El.Table.appendChild(rowEl);
    }
    for (let i = 0; i < Char1List.length; i++) {    // cell colors
        for (let j = ColStart; j <= ColEnd; j++) {
            let row = Char1List[i].rowStart;
            Cell[row][j].element.style.color = 'mediumvioletred';
            Cell[row][j].element.style.fontWeight = 'bold';
        }
        for (let j = ColStart; j <= ColEnd; j++) {
            Cell[Char1List[i].rowEnd + 1][j].element.style.fontWeight = 'bold';
        }
        for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd + 1; j++) {
            Cell[j][1].element.style.color = 'mediumvioletred';
            Cell[j][1].element.style.fontWeight = 'bold';
            Cell[j][2].element.style.fontWeight = 'bold';
        }
        for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd; j++) {
            for (let k = ColStart; k <= ColEnd; k++) {
                Cell[j][k].element.style.backgroundColor = "whitesmoke";
            }
        }
    }
    return;
}

function ResetData () {
// HELP: THIS DELETES THE TABLE, BUT HOW DO I GET IT BACK? I KLUDGED BY CREATING
// A LIST OF ANOTHER 19 TABLES TO KEEP IT WITHTN THE DOM.

        El.Wrapper.removeChild(El.Table);
        let table = "table" + ++TableCopy;
        El.Table = document.getElementById(table);

        Header = ['', '', '', ''];
        Spacer = ['', '', '', '',];
        LineBreak = ['-', '-', '-', '-'];
        Char1List = [];
        Char2List = [];
        Char1Table = [];
        Char2Table = [];
        Table = [];
        Cell = [];
        ColEnd = 0;
        TableTotalRows = 0;
        ColLabel = ['', '', '', ''];
        ProcessedWords = [];
        WordsTotal = 0;
        WordsFound = 0;
        Pangrams = 0;
        PangramsFound = 0;
        Points = 0;
        Genius = 0;
        LetterList = "";
        MainHTML = '';
        HintsHTML = '';
        TableInitialized = false;

        UpdateMetaStats ();
    }
           
//======================================
// MAIN FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

// -------------------------------------
function UpdateList () {
// -------------------------------------
    if (WordsTotal === 0) {
        alert("Please press INITIALIZE first.");
        return;
    }
    GetWordList ();
    let ProcessList = CullList();
    for (let i = 0; i < ProcessList.length; i++) {      // Tally input words
        Table[Char2ToRow(ProcessList[i])][ProcessList[i].length]++;
        WordsFound++;
        let pangram = true;                             // check for Pangram
        for (let j = 0; j < LetterList.length; j++) {
            if (!ProcessList[i].includes(LetterList[j])) {
                pangram = false;
                break;
            }
        }
        if (pangram) PangramsFound++;
    }
    UpdateMetaStats();
    Char1List.forEach(item => {item.colSum(); item.rowSum();});
    DisplayTable();
    DoneIsGray();
    return;
}

function GetWordList () {   // returns list of all FOUND WORDS in DatInput
    let text = MainHTML;
    let index = text.indexOf('<ul class="sb-wordlist-items-pag">');
    text = text.slice(index, text.indexOf('</ul>', index) + 5);
    index = text.indexOf('<span>', 0);
    while (index >= 0) {
        DataInput.push(GetHTMLelement('<span>', text, index).toUpperCase());
        index = text.indexOf('<span>', index + 4);
    }
    return;
}

function CullList() {       // returns list of unprocessed words
    let list = [];
    for (let i = 0; i < DataInput.length; i++) {
        if (!ProcessedWords.includes(DataInput[i])) {
            ProcessedWords.push(DataInput[i]);
            list.push(DataInput[i]);
        }
    }
    return list;
}

function DoneIsGray () {    // grays out completed rows and columns
    for (let i = 0; i < Char1List.length; i++) {
        // check for completed rows
        for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd + 1; j++) {
            if (Table[j][1] === Table[j][2]) {
                RowColor(j, 0, ColEnd, "lightsteelblue")
            }
        }
        // check for completed columns
        for (let j = ColStart; j <= ColEnd; j++) {
            if (Table[Char1List[i].rowStart][j] === Table[Char1List[i].rowEnd + 1][j]) {
                ColColor(j, Char1List[i].rowStart - 1, Char1List[i].rowEnd + 1,"lightsteelblue");
            }
        }
    }
}

function Char2ToRow (word) {            // returns row of char2
    return Char2List[Char2List.findIndex(item => item.char2 === word.slice(0, 2))].row;
}

function RowColor (row, colStart, colEnd, color) {
    for (let col = colStart; col <= colEnd; col++) {
        Cell[row][col].element.style.color = color;
    }
}

function ColColor (col, rowStart, rowEnd, color) {
    for (let row = rowStart; row <= rowEnd; row++) {
        Cell[row][col].element.style.color = color;
    }
}

//======================================
// GENERAL SUB-FUNCTIONS
//======================================

function DisplayTable () {
    for (let i = 0; i < TableTotalRows; i++) {
        for (let j = 0; j <= ColEnd; j++) {
            Cell[i][j].element.innerHTML = Table[i][j];
        }
    }
    // code below displays helpful "0"s by filtering out unhelpful "0"s into "".
    Char1List.forEach(item => {
        for (let col = ColStart; col <= ColEnd; col ++) {
            if (Table[item.rowStart][col] == 0) {
                for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++) {
                    Cell[row][col].element.innerHTML = '';
                }
            }
        }
    });
    return;
}

function UpdateMetaStats () {
    El.MetaStats2.innerHTML = Genius + '<br>' + Pangrams + `<br>` + PangramsFound;
    El.MetaStats4.innerHTML = Points + '<br>' + WordsTotal + `<br>` + WordsFound;
    return;
}

function GetHTMLelement (key, text, index) {
    // key: search term
    // text: string to search
    // index: starting point within text
    // return: HTML element
    
        if (!index) index = 0;
        let index1 = text.indexOf(key, index);
        let index2 = text.indexOf('>', index1) + 1;
        let index3 = text.indexOf('</', index2);
        text = text.slice(0, index3);
        while (text.indexOf('>', index2 + 2) > 0) {
            index2 = text.indexOf('>', index2 + 2) + 1;
        }
        return text.slice(index2, index3);
    }
}       // end of main function  

*/

})();   // end of outer shell function

    