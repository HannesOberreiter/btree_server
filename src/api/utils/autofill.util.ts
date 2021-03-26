import { Transaction } from "objection";

const standardValues = {
    de: {
        apiary: {
            'name': "Muster Bienenstand",
            'latitude': 47.074853,
            'longitude': 12.69527
        },
        source: ["Kunstschwarm", "Ableger", "Schwarm"],
        type: ["Zander", "Langstroth", "Dadant"],
        checkup: ["Kontrolle", "Zargenwechsel"],
        charge_types: ["Zucker", "kg", "Zargen", "Stk."],
        feed_type: ["3:2 Zuckerwasser", "1:1 Zuckerwasser", "Futterteig"],
        harvest: ["Mischhonig", "Raps", "Akazien", "Waldhonig"],
        disease: ["amerikanische Faulbrut", "Schimmel-Pilze", "Ruhr", "Kalkbrut", "Varroa"],
        treatment: ["Wabenentnahme", "Ableger", "Abschwefeln", "Ameisensäure"],
        race: ["A.m.Carnica", "A.m.Ligustica", "A.m.Mellifera"],
        mating: ["Belegstelle", "Standbegattung", "Künstliche Besamung"],
        rearmethod: {
            name: "Starter Finisher",
            note: "Weiselloses Volk, ohne offene Brut zum aufziehen der Weiselzellen."
        },
        reardetail: {
            job: ["Sammelableger", "Weiselzellen brechen", "Umlarven", "Finisher", "Käfigen", "Schlupf"],
            note: [
                "Erstellen des Sammelablegers mit verdeckelte Brutwaben, aufsitzenden Bienen von offener Brut und Pollen und Futterwaben.",
                "Weiselzellen suchen und wenn vorhanden brechen.",
                "Maximal einen Tag alte verwenden! (Anm. 3 Tage Ei Stadium).",
                "Angeblasene Zellen einem weiselrichtigen Wirtschaftsvolk über einem Absperrgitter einhängen.",
                "Schlupfkäfig über Weiselzellen anbringen.",
                "Königinnen schlüpfen (12 Tage nach dem Umlarven)."
            ],
            time: [0, 219, 3, 48, 120, 120]
        }
    }

}

const autoFill = async( trx : Transaction, id : number ) => {
    console.log(standardValues);
    return 
};

export { autoFill }
