export class ObjectX extends Object {

  public static asMap<K, V>(obj: any): Map<K, V> {
    if (obj == null) return null;
    let map = new Map<K, V>();

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        let k = key as K;
        let v = obj[key] as V;
        if (k) {
          map.set(k, v);
        }
      }
    }

    return map;
  }

  public static entriesAsMap<T, U>(obj: any, enumType?: { [key: string]: T}): Map<T|any, U> {
    if (obj == null) return null;

    let map = new Map<T|any, U>();
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (enumType) {
            const t = enumType[key];
            if (t === undefined) {
              console.error(`Invalid key "${key}" for enum`);
            } else {
              map.set(t, obj[key]);
            }
          } else {
            map.set(key, obj[key]);
          }
        }
    }

    return map.size > 0 ? map : null;
  }
}