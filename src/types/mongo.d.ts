import { Document, Model, QueryOptions, Document } from 'mongoose';

export interface CustomModel<T extends Document> extends Model<T> {
  findOnly(query: FilterQuery<T>, filter?: QueryOptions): Promise<T>;
}
