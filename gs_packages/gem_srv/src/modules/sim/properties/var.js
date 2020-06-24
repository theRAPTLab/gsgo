let gtype_id = 0;

class GSVariable {
  constructor() {
    this.id = `G${`${gtype_id++}`.padStart(4, '0')}`;
  }
}

export default GSVariable;
