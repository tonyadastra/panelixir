def FilterVaccines_Stage0_UnitedStates():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedStates_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedStates_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedStates_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedStates_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedStates_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United States%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_UnitedKingdom_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%United Kingdom%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_China():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)

def FilterVaccines_Stage0_China_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_China_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_China_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_China_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_China_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%China%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Japan():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)

def FilterVaccines_Stage0_Japan_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Japan_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Japan_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Japan_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Japan_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Japan%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Germany():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)

def FilterVaccines_Stage0_Germany_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Germany_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Germany_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Germany_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Germany_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Germany%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)



def FilterVaccines_Stage0_India():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)

def FilterVaccines_Stage0_India_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_India_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_India_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_India_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_India_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%India%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_SouthKorea_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%South Korea%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_France_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%France%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Australia():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)

def FilterVaccines_Stage0_Australia_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Australia_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Australia_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Australia_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Australia_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Australia%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Russia_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Russia%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Canada_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Canada%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria_Genetic():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%' AND vac_type = 'Genetic';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria_ViralVector():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%' AND vac_type = 'Viral Vector';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria_ProteinBased():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%' AND vac_type = 'Protein-Based';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria_WholeVirus():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%' AND vac_type = 'Whole-Virus';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)


def FilterVaccines_Stage0_Austria_Repurposed():
    cur.execute("SELECT vac_id, website, stage FROM info WHERE stage=0 AND country LIKE '%Austria%' AND vac_type = 'Repurposed';")
    data = np.array(cur.fetchall())
    cur.execute("rollback")
    return render_template("index.html", data=data, stages=stages)