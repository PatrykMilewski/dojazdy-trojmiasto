import assert from 'node:assert/strict';
import { test } from 'node:test';
import { area, axis, corridor, distance, parcels } from './linia-sn.mjs';

test('area handles empty, reversed and rectangular polygons',()=> {
  assert.equal(area([]),0);
  const square=[[0,0],[10,0],[10,10],[0,10]];
  assert.equal(area(square),100);
  assert.equal(area([...square].reverse()),100);
});

test('strip clipping agrees with a known rectangle aligned to the axis',()=> {
  const dx=axis[1][0]-axis[0][0],dy=axis[1][1]-axis[0][1];
  const length=Math.hypot(dx,dy);
  const point=(along,across)=>[
    axis[0][0]+along*dx/length-across*dy/length,
    axis[0][1]+along*dy/length+across*dx/length,
  ];
  const rectangle=[point(0,-10),point(20,-10),point(20,10),point(0,10)];
  assert.ok(Math.abs(area(corridor(rectangle,3))-120)<.00001);
  assert.ok(Math.abs(area(corridor(rectangle,50))-400)<.00001);
});

test('all parcel intersections stay within strip and area bounds',()=> {
  for(const poly of Object.values(parcels)) {
    let previous=0;
    for(let width=0;width<=12;width+=.5) {
      const clipped=corridor(poly,width);
      const result=area(clipped);
      assert.ok(result>=previous-.00001);
      assert.ok(result<=area(poly)+.00001);
      assert.ok(clipped.every(p=>Math.abs(distance(p))<=width+.00001));
      previous=result;
    }
  }
});

test('screening includes 9, 10 and corner of 11; 8 and 12 outside default strip',()=> {
  for(const id of [9,10,11]) assert.ok(area(corridor(parcels[id],7))>0);
  for(const id of [8,12]) assert.equal(area(corridor(parcels[id],7)),0);
});
