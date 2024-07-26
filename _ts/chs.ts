import * as T from './types.js';
export const ChannelsSpecialMap = new Map<string, T.channelSpecial>();
export const ChannelsStreamSet = new Set<string>();
export const ChannelBucketsMap = new Map();


// tylko bez tagów + nocnazmiana
ChannelsSpecialMap.set("x", {
	selector: "x",
	urlPath: "x",
	name: "bez tagów",
	description: "bez tagów i nocna",
	tabTitle: "MikroblogX",
	hashName: "#mikroblogx"
});
// wszystki z minimum 1 tagiem
ChannelsSpecialMap.set("x_minus", {
	selector: "x_minus",
	urlPath: "-",
	name: "wszystkie z tagami",
	description: "wszystkie z tagami",
	tabTitle: "mikroblog-",
	hashName: "#mikroblog-"

});
// cały mikroblog
ChannelsSpecialMap.set("x_plus", {
	selector: "x_plus",
	urlPath: "mikroblog+",
	name: "cały mikroblog",
	description: "cały mikroblog",
	tabTitle: "mikroblog+",
	hashName: "#mikroblog+"
});

ChannelsSpecialMap.set("observed", {
	selector: "observed",
	urlPath: "🤍",
	name: "mój mikroczat",
	description: "mój mikroczat",
	tabTitle: "🤍 obserwowane",
	hashName: "#mój wykop"
});

ChannelsSpecialMap.set("observed_users", {
	selector: "observed_users",
	urlPath: "💙",
	name: "obserwowani użytkownicy",
	description: "obserwowani użytkownicy",
	tabTitle: "💙 użytkownicy obserwowani ",
	hashName: "#obserwowani użytkownicy"
});

ChannelsSpecialMap.set("observed_tags", {
	selector: "observed_tags",
	urlPath: "🖤",
	name: "obserwowane tagi",
	description: "obserwowane tagi",
	tabTitle: "🖤 #tagi obserwowane",
	hashName: "#obserwowane tagi"
});




// 6e5b77f261adb65ed17e
ChannelBucketsMap.set("wybory", "6e5b77f261adb65ed17e");
ChannelBucketsMap.set("bazarek", "6e5b77f261adb65ed17e");



// https://wykop.pl/moje/54fb5bae8a3f17db45b8/edycja
ChannelBucketsMap.set("astronomia", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("kosmos", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("spacex", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("starlink", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("mirkokosmos", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("wszechswiat", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("kosmosboners", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("rakiety", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("startyrakiet", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("eksploracjakomosu", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("podbojkosmosu", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("starliner", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("shenzhou", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("starship", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("falcon", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("falconheavy", "54fb5bae8a3f17db45b8");
ChannelBucketsMap.set("nasa", "54fb5bae8a3f17db45b8");



// https://wykop.pl/moje/211af21c636f5757ae9c/edycja
ChannelBucketsMap.set("wykop", "211af21c636f5757ae9c");
ChannelBucketsMap.set("wykopchangelog", "211af21c636f5757ae9c");
ChannelBucketsMap.set("nowywykop", "211af21c636f5757ae9c");
ChannelBucketsMap.set("wykop20", "211af21c636f5757ae9c");
ChannelBucketsMap.set("nowywykop20", "211af21c636f5757ae9c");
ChannelBucketsMap.set("nowywykoptogowno", "211af21c636f5757ae9c");
ChannelBucketsMap.set("wyk0p", "211af21c636f5757ae9c");
ChannelBucketsMap.set("wypok", "211af21c636f5757ae9c");
ChannelBucketsMap.set("wyppk", "211af21c636f5757ae9c");

// https://wykop.pl/moje/d4e3418548399bd0d1e5/edycja
ChannelBucketsMap.set("kanalzero", "d4e3418548399bd0d1e5");
ChannelBucketsMap.set("stanowski", "d4e3418548399bd0d1e5");
ChannelBucketsMap.set("krzysztofstanowski", "d4e3418548399bd0d1e5");
ChannelBucketsMap.set("mazurek", "d4e3418548399bd0d1e5");
ChannelBucketsMap.set("robertmazurek", "d4e3418548399bd0d1e5");

// https://wykop.pl/moje/ed5846c4763b2c1e8e43/edycja
ChannelBucketsMap.set("kanalsportowy", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("smokowski", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("tomaszsmokowski", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("borek", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("mateuszborek", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("pol", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("michalpol", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("maciejsawicki", "ed5846c4763b2c1e8e43");
ChannelBucketsMap.set("sawicki", "ed5846c4763b2c1e8e43");

// https://wykop.pl/moje/921890fd035e2f0eb498/edycja
ChannelBucketsMap.set("pilkanozna", "921890fd035e2f0eb498");
ChannelBucketsMap.set("mecz", "921890fd035e2f0eb498");
ChannelBucketsMap.set("euro2024", "921890fd035e2f0eb498");
ChannelBucketsMap.set("euro2028", "921890fd035e2f0eb498");
ChannelBucketsMap.set("euro2032", "921890fd035e2f0eb498");
ChannelBucketsMap.set("mundial", "921890fd035e2f0eb498");
ChannelBucketsMap.set("mundial2026", "921890fd035e2f0eb498");
ChannelBucketsMap.set("michalpol", "921890fd035e2f0eb498");
ChannelBucketsMap.set("mundial2030", "921890fd035e2f0eb498");
ChannelBucketsMap.set("mundial2034", "921890fd035e2f0eb498");

// https://wykop.pl/moje/f7e061622d62d4faea35/edycja
ChannelBucketsMap.set("fame", "f7e061622d62d4faea35");
ChannelBucketsMap.set("famemma", "f7e061622d62d4faea35");
ChannelBucketsMap.set("fammemma", "f7e061622d62d4faea35");
ChannelBucketsMap.set("fammema", "f7e061622d62d4faea35");
ChannelBucketsMap.set("famemmarestream", "f7e061622d62d4faea35");
ChannelBucketsMap.set("primemma", "f7e061622d62d4faea35");
ChannelBucketsMap.set("clout", "f7e061622d62d4faea35");
ChannelBucketsMap.set("cloutmma", "f7e061622d62d4faea35");
ChannelBucketsMap.set("cloudmma", "f7e061622d62d4faea35");

// https://wykop.pl/moje/95bdaf2a585b1358ec69/edycja
ChannelBucketsMap.set("sejm", "95bdaf2a585b1358ec69");
ChannelBucketsMap.set("sejmflix", "95bdaf2a585b1358ec69");
ChannelBucketsMap.set("komisjasledcza", "95bdaf2a585b1358ec69");

// https://wykop.pl/moje/513ede2bc0cc1089ce7a/edycja
ChannelBucketsMap.set("czytajzwykopem", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ksiazki", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ksiazkiboners", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ksiazka", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ksiazkawpodrozy", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ksiazkadlaprzegrywa", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("literatura", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ebook", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("ebooki", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("literaturazmaude", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("bookchallenge", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("booktalk", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("czytanie", "513ede2bc0cc1089ce7a");
ChannelBucketsMap.set("czytam", "513ede2bc0cc1089ce7a");

// https://wykop.pl/moje/7d1b1007b80d21c2282c/edycja
ChannelBucketsMap.set("matura", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("matura2023", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("matura2024", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("matura2025", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("matura2026", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("przeciekizmatury", "7d1b1007b80d21c2282c");
ChannelBucketsMap.set("przeciekimaturalne", "7d1b1007b80d21c2282c");

// https://wykop.pl/moje/6d85ecfa6687be6e9630/edycja
ChannelBucketsMap.set("slowacja", "6d85ecfa6687be6e9630");
ChannelBucketsMap.set("zamach", "6d85ecfa6687be6e9630");
ChannelBucketsMap.set("fico", "6d85ecfa6687be6e9630");


// https://wykop.pl/moje/266f87dbd1077e3d9da0/edycja
ChannelBucketsMap.set("pogoda", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("burza", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("burze", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("deszcz", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("grad", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("meteorologia", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("upaly", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("upal", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("alertrcb", "266f87dbd1077e3d9da0");
ChannelBucketsMap.set("lowcyburz", "266f87dbd1077e3d9da0");


// export const ChannelsMultipleMap = new UniqueItemStore



ChannelsStreamSet.add("2137");
ChannelsStreamSet.add("4konserwy");
ChannelsStreamSet.add("aferki");
ChannelsStreamSet.add("aferkitv");
ChannelsStreamSet.add("astronomia");
ChannelsStreamSet.add("alertrcb");

ChannelsStreamSet.add("bazarek");
ChannelsStreamSet.add("bekazko");
ChannelsStreamSet.add("bekazkonfederacji");
ChannelsStreamSet.add("bekazlewactwa");
ChannelsStreamSet.add("bekazpisiorow");
ChannelsStreamSet.add("bekazpisu");
ChannelsStreamSet.add("bekazpo");
ChannelsStreamSet.add("bekazprawakow");
ChannelsStreamSet.add("bitcoin");
ChannelsStreamSet.add("boks");
ChannelsStreamSet.add("bosak");
ChannelsStreamSet.add("boxdel");
ChannelsStreamSet.add("braun");
ChannelsStreamSet.add("braungrzegorz");
ChannelsStreamSet.add("budda");
ChannelsStreamSet.add("burza");
ChannelsStreamSet.add("burze");

ChannelsStreamSet.add("clout");
ChannelsStreamSet.add("cloutmma");
ChannelsStreamSet.add("cloudmma");
ChannelsStreamSet.add("crypto");

ChannelsStreamSet.add("deszcz");
ChannelsStreamSet.add("donaldtusk");
ChannelsStreamSet.add("dziennikarskie0");
ChannelsStreamSet.add("dziennikarskiezero");

ChannelsStreamSet.add("eksploracjakomosu ");
ChannelsStreamSet.add("ether");
ChannelsStreamSet.add("ethereum");
ChannelsStreamSet.add("eurowizja");
ChannelsStreamSet.add("EurovisionSongContest");
ChannelsStreamSet.add("eurovision");

ChannelsStreamSet.add("f1");
ChannelsStreamSet.add("fakty");
ChannelsStreamSet.add("faktytvn");
ChannelsStreamSet.add("fame");
ChannelsStreamSet.add("famemma");
ChannelsStreamSet.add("fammema");
ChannelsStreamSet.add("famemmatv");
ChannelsStreamSet.add("FAMEMMATV");
ChannelsStreamSet.add("falcon");
ChannelsStreamSet.add("falconheavy");
ChannelsStreamSet.add("fico");
ChannelsStreamSet.add("floryda");
ChannelsStreamSet.add("france");
ChannelsStreamSet.add("france24");
ChannelsStreamSet.add("francja");
ChannelsStreamSet.add("francuski");
ChannelsStreamSet.add("francuzki");
ChannelsStreamSet.add("friz");

ChannelsStreamSet.add("gielda");
ChannelsStreamSet.add("gola");
ChannelsStreamSet.add("Goats");
ChannelsStreamSet.add("grad");
ChannelsStreamSet.add("grzegorzbraun");
ChannelsStreamSet.add("GrzegorzBraunTV");
ChannelsStreamSet.add("iran");
ChannelsStreamSet.add("iss");
ChannelsStreamSet.add("isstracker");
ChannelsStreamSet.add("isstrackerpl");
ChannelsStreamSet.add("janpawel");
ChannelsStreamSet.add("janpaweldrugi");
ChannelsStreamSet.add("janpawel2");
ChannelsStreamSet.add("janpawelii");
ChannelsStreamSet.add("jaroslawkaczynski");
ChannelsStreamSet.add("jaruzelska");
ChannelsStreamSet.add("jaruzelski");
ChannelsStreamSet.add("jkm");
ChannelsStreamSet.add("kaczynski");

ChannelsStreamSet.add("kanal0");
ChannelsStreamSet.add("kanalzero");
ChannelsStreamSet.add("KanalZeroPL");
ChannelsStreamSet.add("kanalsportowy");
ChannelsStreamSet.add("Kanal_Sportowy");
ChannelsStreamSet.add("kanalsportowy");
ChannelsStreamSet.add("smokowski");
ChannelsStreamSet.add("tomaszsmokowski");
ChannelsStreamSet.add("borek");
ChannelsStreamSet.add("mateuszborek");
ChannelsStreamSet.add("pol");
ChannelsStreamSet.add("michalpol");
ChannelsStreamSet.add("maciejsawicki");
ChannelsStreamSet.add("sawicki");



ChannelsStreamSet.add("kancelariapremiera");
ChannelsStreamSet.add("kedzierski");
ChannelsStreamSet.add("kedzierskiwojewodzki");
ChannelsStreamSet.add("kijow");
ChannelsStreamSet.add("konfederacja");
ChannelsStreamSet.add("Konfederacja_Oficjalny");
ChannelsStreamSet.add("konopski");
ChannelsStreamSet.add("Konopskyy");
ChannelsStreamSet.add("kosmos");
ChannelsStreamSet.add("kosmosboners");
ChannelsStreamSet.add("koalicjaobywatelska");
ChannelsStreamSet.add("kubawojewodzki");
ChannelsStreamSet.add("kubawojewucki");
ChannelsStreamSet.add("kubawojewudzki");

ChannelsStreamSet.add("lexy");
ChannelsStreamSet.add("lowcyburz");
ChannelsStreamSet.add("lowcyburzpim");

ChannelsStreamSet.add("maciejsawicki");
ChannelsStreamSet.add("market");
ChannelsStreamSet.add("mateuszborek");
ChannelsStreamSet.add("mazurek");
ChannelsStreamSet.add("meteorologia");
ChannelsStreamSet.add("memcen");
ChannelsStreamSet.add("mentzen");
ChannelsStreamSet.add("miami");
ChannelsStreamSet.add("michalpol");
ChannelsStreamSet.add("mirkokosmos");
ChannelsStreamSet.add("monikajaruzelska");
ChannelsStreamSet.add("MonikaJaruzelskazaprasza");
ChannelsStreamSet.add("morawiecki");

ChannelsStreamSet.add("nadiafrance");
ChannelsStreamSet.add("namzalezy");
ChannelsStreamSet.add("namzalezypl");
ChannelsStreamSet.add("NASAgovVideo");
ChannelsStreamSet.add("nasa");
ChannelsStreamSet.add("neuropa");
ChannelsStreamSet.add("newyork");
ChannelsStreamSet.add("nikita");
ChannelsStreamSet.add("nocnazmiana");
ChannelsStreamSet.add("nowanadzieja");
ChannelsStreamSet.add("nowyjork");
ChannelsStreamSet.add("onet");
ChannelsStreamSet.add("onetnews");
ChannelsStreamSet.add("onetpl");

ChannelsStreamSet.add("pogoda");
ChannelsStreamSet.add("Pol");
ChannelsStreamSet.add("polityka");
ChannelsStreamSet.add("pol");
ChannelsStreamSet.add("polsat");
ChannelsStreamSet.add("polsatnews");
ChannelsStreamSet.add("polsatnewsplofc");
ChannelsStreamSet.add("polskieradio");
ChannelsStreamSet.add("PolskieradioPlofficial");
ChannelsStreamSet.add("polskieradio24");
ChannelsStreamSet.add("polskieradio24pl");
ChannelsStreamSet.add("podbojkosmosu");
ChannelsStreamSet.add("premier");
ChannelsStreamSet.add("premierRP");
ChannelsStreamSet.add("pr1");
ChannelsStreamSet.add("pr24");
ChannelsStreamSet.add("primemma");
ChannelsStreamSet.add("PRIMESHOWMMA");
ChannelsStreamSet.add("radio");
ChannelsStreamSet.add("radioeska");
ChannelsStreamSet.add("RadioTOKFM");
ChannelsStreamSet.add("radiopr24");
ChannelsStreamSet.add("radiormf");
ChannelsStreamSet.add("radiormf24");
ChannelsStreamSet.add("radiormffm");
ChannelsStreamSet.add("radiotokfm");
ChannelsStreamSet.add("radiozet");
ChannelsStreamSet.add("rakiety");
ChannelsStreamSet.add("rafalziemkiewicz");
ChannelsStreamSet.add("republika");
ChannelsStreamSet.add("R_A_Ziemkiewicz");
ChannelsStreamSet.add("RMF24Video");

ChannelsStreamSet.add("sebcel");
ChannelsStreamSet.add("biegajzsebcelem");
ChannelsStreamSet.add("frajerzyzmlm");
ChannelsStreamSet.add("sebastianpodsiadlo");
ChannelsStreamSet.add("wolfx");
ChannelsStreamSet.add("wolfxtv");
ChannelsStreamSet.add("contrawise");
ChannelsStreamSet.add("contrawisepro");
ChannelsStreamSet.add("elitaexpert");
ChannelsStreamSet.add("eliteexpert");
ChannelsStreamSet.add("sebcel");
ChannelsStreamSet.add("sebcel");


ChannelsStreamSet.add("sejm");
ChannelsStreamSet.add("sejmflix");
ChannelsStreamSet.add("SejmRP_PL");
ChannelsStreamSet.add("sejmstream");
ChannelsStreamSet.add("sentino");
ChannelsStreamSet.add("shenzhou");
ChannelsStreamSet.add("skynews");
ChannelsStreamSet.add("slawomirmentzen");
ChannelsStreamSet.add("slowacja");
ChannelsStreamSet.add("smokowski");
ChannelsStreamSet.add("Space-Affairs");
ChannelsStreamSet.add("SpaceAffairs");
ChannelsStreamSet.add("SpaceX");
ChannelsStreamSet.add("spacex");

ChannelsStreamSet.add("sport");
ChannelsStreamSet.add("pilkanozna");
ChannelsStreamSet.add("mecz");
ChannelsStreamSet.add("euro2024");
ChannelsStreamSet.add("euro2028");
ChannelsStreamSet.add("euro2032");
ChannelsStreamSet.add("mundial");
ChannelsStreamSet.add("mundial2026");
ChannelsStreamSet.add("mundial2030");
ChannelsStreamSet.add("mundial2034");

ChannelsStreamSet.add("SuperExpressOfficial");
ChannelsStreamSet.add("superexpress");
ChannelsStreamSet.add("superexpres");
ChannelsStreamSet.add("superekspres");
ChannelsStreamSet.add("superekspres");
ChannelsStreamSet.add("starliner");
ChannelsStreamSet.add("starlink");
ChannelsStreamSet.add("startyrakiet");
ChannelsStreamSet.add("starship");
ChannelsStreamSet.add("stanowski");
ChannelsStreamSet.add("stockmarket");
ChannelsStreamSet.add("szeliga");
ChannelsStreamSet.add("Telewizja_Republika");
ChannelsStreamSet.add("telewizja");
ChannelsStreamSet.add("telewizjarepublika");
ChannelsStreamSet.add("tesla");
ChannelsStreamSet.add("TheLaunchPad");
ChannelsStreamSet.add("tomaszsmokowski");
ChannelsStreamSet.add("tokfm");
ChannelsStreamSet.add("tusk");
ChannelsStreamSet.add("tvn");
ChannelsStreamSet.add("TVN24");
ChannelsStreamSet.add("tvn24");
ChannelsStreamSet.add("tvpis");
ChannelsStreamSet.add("tvpinfo");
ChannelsStreamSet.add("tvpsport");
ChannelsStreamSet.add("tvp_sport");

ChannelsStreamSet.add("upal");
ChannelsStreamSet.add("upaly");
ChannelsStreamSet.add("ulpik");

ChannelsStreamSet.add("wawa");
ChannelsStreamSet.add("warsaw");
ChannelsStreamSet.add("warszawa");
ChannelsStreamSet.add("wardega");
ChannelsStreamSet.add("wojna");
ChannelsStreamSet.add("wojnaidei");
ChannelsStreamSet.add("WojnaIdeiPL");
ChannelsStreamSet.add("WojewodzkiKedzierski");
ChannelsStreamSet.add("wojewocki");
ChannelsStreamSet.add("wojewodzki");
ChannelsStreamSet.add("wojewodzkikedzierski");
ChannelsStreamSet.add("wojewucki");
ChannelsStreamSet.add("wp");
ChannelsStreamSet.add("wp-pl");
ChannelsStreamSet.add("wppl");
ChannelsStreamSet.add("wirtualnapolska");
ChannelsStreamSet.add("wszechswiat");
ChannelsStreamSet.add("wybory");
ChannelsStreamSet.add("wykopwnowymstylu");
ChannelsStreamSet.add("wykopx");
ChannelsStreamSet.add("wybory");

ChannelsStreamSet.add("ziemkiewicz");



ChannelsStreamSet.add("everydayastronaut");



