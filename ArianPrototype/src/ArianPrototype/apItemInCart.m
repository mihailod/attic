//
//  apItemInCart.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apItemInCart.h"

@implementation apItemInCart

@synthesize name;
@synthesize quantity;
@synthesize price;
@synthesize image;
@synthesize delivery;
@synthesize format;
@synthesize discount;

-(apItemInCart*)copy:(apItemInCart*)original
{
    apItemInCart *copy = [[apItemInCart alloc] init];
    copy.name = original.name;
    copy.quantity = original.quantity;
    copy.price = original.price;
    copy.image = original.image;
    copy.delivery = original.delivery;
    copy.format = original.format;
    copy.discount = original.discount;
    return copy;
}

@end
