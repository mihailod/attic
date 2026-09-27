//
//  apSecondViewController.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface apSecondViewController : UIViewController <UITextFieldDelegate>

@property (weak, nonatomic) IBOutlet UITextField *searchField;
@property (strong, nonatomic) NSArray *searchResults;
@property (strong, nonatomic) IBOutlet UITableView *searchTableView;

@end
