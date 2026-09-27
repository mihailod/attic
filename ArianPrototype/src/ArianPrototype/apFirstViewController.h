//
//  apFirstViewController.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface apFirstViewController : UIViewController <UITableViewDelegate>

@property (nonatomic, retain) IBOutlet UITableView *tableView;
@property (nonatomic, retain) IBOutlet UITextField *textField;
@property (nonatomic, retain) NSArray *searchResults;

@end
