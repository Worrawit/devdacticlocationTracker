export const geofenceConfig = {
    radius          : 200,
    transitionType  : 2 //Type of transition 1 - Enter, 2 - Exit, 3 - Both
};

export const polylineConfig = {
    strokeColor     : '#0099ff',
    strokeOpacity   : 1.0,
    strokeWeight    : 3
};

export const distanceConfig = {
    //'M' is statute miles (default)
    //'K' is kilometers
    //'N' is nautical miles
    unit     : "K",
    //'H' is Hour
    //'m' is min
    //'s' is sec
    timeUnit : "s"
};