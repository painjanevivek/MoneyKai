import { describe, expect, it } from 'vitest';
import training from './models/categoryTrainingData.json';
import corpus from './models/categoryPurposeDataV2.json';
import { classifyCounterpartyCategory, predictCategory, trainCategoryModel } from './offlineCategoryModel';
const categoryTrainingExamples = corpus.examples;

export const CATEGORY_HOLDOUT = [
  ['food', 'Pune Riverside Cafe'], ['food', 'Mumbai Pizza Restaurant'], ['food', 'Nagpur Fresh Bakery'],
  ['healthcare', 'Sunrise Medico'], ['healthcare', 'Health First Medical'], ['healthcare', 'Pune Pharmacy'],
  ['shopping', 'City Grocery Shop'], ['shopping', 'Weekend Supermarket'], ['shopping', 'Trend Apparel'],
  ['electronics', 'Laptop Service Computer'], ['electronics', 'Digital Electronics Hub'], ['electronics', 'Home Appliances'],
  ['transport', 'City Taxi Cab'], ['transport', 'Central Metro Rail'], ['transport', 'Express Petrol Pump'],
  ['bills', 'Residential Electricity Utility'], ['bills', 'Family Broadband Recharge'], ['bills', 'Monthly Water Bill'],
  ['education', 'Sunrise School Tuition'], ['education', 'Learning University Fees'], ['education', 'Oxford College Fees'],
  ['entertainment', 'Local Cinema Movie'], ['entertainment', 'Weekend Theatre Tickets'], ['entertainment', 'Summer Amusement Park'],
  ['rent', 'City Flat Rent'], ['rent', 'Family Apartment Rental'], ['rent', 'Residential Housing Lease'],
] as const;

describe('offline trained categorization', () => {
  it('trains reproducibly from 3888 explicit synthetic purpose labels without network or SMS content', () => {
    expect(categoryTrainingExamples).toHaveLength(3888);
    const model = trainCategoryModel(categoryTrainingExamples);
    expect(model.labels).toHaveLength(9);
    expect(predictCategory('Sunrise Medico', model)).toBe('healthcare');
    expect(predictCategory('Cafe Dining', model)).toBe('food');
    expect(predictCategory('Unseen Counterparty', model)).toBeUndefined();
  });
  it.each(CATEGORY_HOLDOUT)('synthetic unseen entity %s: %s', (category, counterparty) => {
    expect(categoryTrainingExamples.some((row) => row.text.toLowerCase() === counterparty.toLowerCase())).toBe(false);
    expect(predictCategory(counterparty)).toBe(category);
  });
  it.each(['Vivek Naresh Painjane', 'Ajay Patil', 'Arun Kumar', 'XYZQ Enterprises', 'Ramesh Singh', 'Foo Bar'])('abstains on an unknown name: %s', name => {
    expect(predictCategory(name)).toBeUndefined();
    expect(classifyCounterpartyCategory(name).reliable).toBe(false);
  });
  it.each(['Health Wellness', 'Wellness Spa', 'Swiggy Instamart', 'Amazon Gift', 'Cafe Medical', 'BigBasket', 'Blinkit', 'Zepto'])('never treats mixed or ambiguous use as reliable: %s', name => {
    expect(classifyCounterpartyCategory(name).reliable).toBe(false);
  });
  it('has one class per training entity, without duplicates or category leakage', () => {
    expect(new Set(categoryTrainingExamples.map((row) => row.text.toLowerCase())).size).toBe(3888);
    expect(Object.keys(training.categories)).toHaveLength(9);
  });
});
