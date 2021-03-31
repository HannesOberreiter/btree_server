import { BaseOptionModel } from '@models/baseoption.model';

export class TreatmentType extends BaseOptionModel {

    static tableName = "treatment_types";

    constructor() {
        super();
    }

}