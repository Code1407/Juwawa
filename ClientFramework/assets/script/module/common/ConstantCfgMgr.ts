
// import { TableConstant } from "db://assets/script/table/TableConstant";

// export namespace ConstantKey {
//     /** 同时能选几个水果 */
//     //export const FruitSelectNum: number = 1;
// }

// export class ConstantDataManager {

//     private static table: TableConstant = new TableConstant();
//     private static intArrayMap: Map<number, number[]> = new Map();

//     public static getValue(id: number): string {
//         this.table.init(id);
//         return this.table.value;
//     }

//     public static getNumber(id: number): number {
//         let value = this.getValue(id);
//         if (value == null) {
//             return 0;
//         }
//         return parseInt(value, 10)
//     }

//     public static getIntArray(id: number): number[] {
//         if (this.intArrayMap.has(id)) {
//             return this.intArrayMap.get(id);
//         }
//         let value = this.getValue(id);
//         if (value == null) {
//             return null;
//         }
//         let result = value.split('|').map(Number);
//         this.intArrayMap.set(id, result);
//         return result;
//     }
// }

