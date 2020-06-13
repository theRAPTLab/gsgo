let gtype_id = 0;

class GBaseType {
  constructor() {
    this.id = `G${`${gtype_id++}`.padStart(4, '0')}`;
  }
}

export default GBaseType;
