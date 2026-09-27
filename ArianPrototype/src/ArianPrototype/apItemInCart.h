//
//  apItemInCart.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface apItemInCart : NSObject

@property NSString *name;
@property int quantity;
@property float price;
@property UIImage *image;
@property int delivery;
@property int format;
@property float discount;

-(apItemInCart*)copy:(apItemInCart*)original;

@end
