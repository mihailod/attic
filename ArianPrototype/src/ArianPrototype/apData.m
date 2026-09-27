//
//  apData.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/19/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apData.h"

@implementation apData

@synthesize products1;
@synthesize products2;
@synthesize products3;

@synthesize panoramicCanvasPrices;
@synthesize panoramicCanvasResolutions;
@synthesize panoramicCanvasFormatImages;

@synthesize shippingPrices;
@synthesize quantities;

@synthesize euroFormatter;

- (id) init {
    self = [super init];
    
    products1 = [NSArray arrayWithObjects: @"Stickers", @"Printable Beverage Cans", @"Writing Pads", @"Stationery",
                 @"Envelopes", @"Books and Brochures", @"Desk Pads", @"Tickets",
                 @"Labels", @"Leaflets", @"Flyer", @"Office Equipment", @"Greeting and Invitation Cards",
                 @"Sticky Notes", @"Calendars", @"Wristbands", @"Pens", @"Magazines", @"Folders", @"Multimedia", @"Posters",
                 @"Plastic Cards", @"Postcards", @"Product Packaging",
                 @"Promotional Items", @"Sponsors Items", @"Stamps and Accessories", @"Bags", @"Business Cards",
                 @"Greeting & Invitation Cards", @"Rigid Foam Board", @"Adhesive Film", @"Private Label Drinks", nil];
    
    products2 = [NSArray arrayWithObjects: @"Beach Banner", @"Fabric Banner", @"Sticker", @"Direct Print on Acryllic Glass", @"Envelopes",
                 @"Desk Pads", @"Tickets", @"Direct Print on Glass", @"Displays", @"Flags",
                 @"Large Format Posters", @"Large Format Stickers", @"Slipcovers", @"Slipcovers for Fences",
                 @"Customer Signs", @"Panoramic Canvas", @"Roll-on", @"Magnetic Foil", @"Posters Stafix", @"Photo Album", nil];
    
    products3 = [NSArray arrayWithObjects: @"Desk and Floor Windows", @"Folding Frame", @"Poster Clamps", @"L-Stand", @"Menu Card Holder",
                 @"Prospect Bag", @"Brochure Stand (plastic)", @"Brochure Stand (metal)", @"Table Tents",
                 @"Business Card Cases", @"Business Card Holder", @"Money Tray", nil];
    
    panoramicCanvasPrices = [NSArray arrayWithObjects:
        [NSNumber numberWithFloat:80],  [NSNumber numberWithFloat:102], [NSNumber numberWithFloat:142], [NSNumber numberWithFloat:212],
        [NSNumber numberWithFloat:249], [NSNumber numberWithFloat:249], [NSNumber numberWithFloat:269], [NSNumber numberWithFloat:349],
        [NSNumber numberWithFloat:349], [NSNumber numberWithFloat:369], [NSNumber numberWithFloat:469], [NSNumber numberWithFloat:469],
        nil];
    
    panoramicCanvasResolutions = [NSArray arrayWithObjects:
                                  @"762 x 381 px", @"920 x 460 px", @"1370 x 460 px", @"1830 x 450 px",
                                  @"1830 x 610 px", @"1830 x 610 px", @"1830 x 610 px", @"1830 x 920 px",
                                  @"1830 x 915 px", @"1830 x 915 px", @"2285 x 1150 px", @"2300 x 1150 px",
                                  nil];
    
    panoramicCanvasFormatImages = [NSArray arrayWithObjects:
                                   [UIImage imageNamed:@"pc1"], [UIImage imageNamed:@"pc2"],  [UIImage imageNamed:@"pc3"],  [UIImage imageNamed:@"pc4"],
                                   [UIImage imageNamed:@"pc5"], [UIImage imageNamed:@"pc6"],  [UIImage imageNamed:@"pc7"],  [UIImage imageNamed:@"pc8"],
                                   [UIImage imageNamed:@"pc9"], [UIImage imageNamed:@"pc10"], [UIImage imageNamed:@"pc11"], [UIImage imageNamed:@"pc12"],
                                   nil];
    
    shippingPrices = [NSArray arrayWithObjects: [NSNumber numberWithFloat:5],  [NSNumber numberWithFloat:25], [NSNumber numberWithFloat:30], nil];
    
    quantities = [NSArray arrayWithObjects:
                  [NSNumber numberWithInt:250], [NSNumber numberWithInt:500], [NSNumber numberWithInt:1000], [NSNumber numberWithInt:1500],
                  [NSNumber numberWithInt:2000], [NSNumber numberWithInt:2500], [NSNumber numberWithInt:5000], [NSNumber numberWithInt:7500],
                  [NSNumber numberWithInt:10000], [NSNumber numberWithInt:20000], [NSNumber numberWithInt:50000],
                  nil];
    
    euroFormatter = [[NSNumberFormatter alloc] init];
    [euroFormatter setNumberStyle:NSNumberFormatterCurrencyStyle];
    [euroFormatter setCurrencyCode:@"EUR"];
    [euroFormatter setCurrencyDecimalSeparator:@","];
    [euroFormatter setCurrencyGroupingSeparator:@"."];
    
    return self;
}

- (void)searchArray:(NSArray *)array :(NSString *)text :(NSMutableArray *)result {
    for(int i=0; i<array.count; i++) {
        NSString *s = array[i];
        NSRange r = [s rangeOfString:text options:NSCaseInsensitiveSearch];
        if (r.location != NSNotFound) {
            [result addObject:s];
        }
    }
    
}

- (NSArray *) search:(NSString *)text {
    NSMutableArray *products = [[NSMutableArray alloc] init];
    [self searchArray:products1 :text :products];
    [self searchArray:products2 :text :products];
    [self searchArray:products3 :text :products];
    return products;
}

@end
