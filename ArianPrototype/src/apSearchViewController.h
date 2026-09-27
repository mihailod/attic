//
//  apSearchViewController.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface apSearchViewController : UIViewController <UISearchBarDelegate>

@property (strong, nonatomic) NSArray *searchResults;
@property (strong, nonatomic) IBOutlet UITableView *searchTableView;

@end
