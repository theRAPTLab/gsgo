let gtype_id = 0;

class GSBaseType {
  constructor() {
    this.id = `G${`${gtype_id++}`.padStart(4, '0')}`;
  }
}

export default GSBaseType;
