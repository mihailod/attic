//
//  apAppDelegate.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apAppDelegate.h"
#import "apData.h"

@implementation apAppDelegate

@synthesize data;
@synthesize cart;
@synthesize loggedIn;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // Override point for customization after application launch.
    
    data = [[apData alloc] init];
    cart = [[NSMutableArray alloc] init];
    
    
     
    //NSURL *scriptUrl = [NSURL URLWithString:@"http://www.google.com/m"];
    //NSData *data1 = [NSData dataWithContentsOfURL:scriptUrl];
    /*if (data)
    NSLog(@"Device is connected to the internet");
    else
    NSLog(@"Device is not connected to the internet");*/
    
    /*if (!data1) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Internet Connection Failed"
                                                        message:@"Arian Webshop requires internet connection. Please quit the app, establish the internet connection, and then try again."
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
    }*/
    return YES;
}
							
- (void)applicationWillResignActive:(UIApplication *)application
{
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later. 
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

@end
