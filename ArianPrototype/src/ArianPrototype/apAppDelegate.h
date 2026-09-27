//
//  apAppDelegate.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "apData.h"

@interface apAppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

@property (strong, nonatomic) apData *data;
@property (strong, nonatomic) NSMutableArray *cart;

@property BOOL loggedIn;

@end
