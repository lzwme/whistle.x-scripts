const { EventEmitter } = require('events');

const dataSource = new EventEmitter();
dataSource.setMaxListeners(1000);

export default dataSource;
