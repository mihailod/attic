//
//  apData.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/19/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface apData : NSObject

@property NSArray *products1;
@property NSArray *products2;
@property NSArray *products3;

- (NSArray *) search:(NSString *)text;

@property NSMutableArray *cart;

@property NSArray *panoramicCanvasPrices;
@property NSArray *panoramicCanvasResolutions;
@property NSArray *panoramicCanvasFormatImages;

@property NSArray *shippingPrices;
@property NSArray *quantities;

@property NSNumberFormatter *euroFormatter;

@end
